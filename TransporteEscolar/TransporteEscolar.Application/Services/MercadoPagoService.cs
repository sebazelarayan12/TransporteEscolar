using System.Globalization;
using MercadoPago.Client.Common;
using MercadoPago.Client.Payment;
using MercadoPago.Client.Preference;
using MercadoPago.Config;
using MercadoPago.Resource.Payment;
using MercadoPago.Resource.Preference;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.MercadoPago;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public sealed class MercadoPagoService : IMercadoPagoService
{
    private readonly IOptions<MercadoPagoSettings> _settings;
    private readonly ILogger<MercadoPagoService> _logger;

    public MercadoPagoService(
        IOptions<MercadoPagoSettings> settings,
        ILogger<MercadoPagoService> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task<MercadoPagoLinkResult> GetOrCreatePreferenceAsync(
        PagoMensual pago,
        Titular titular,
        CancellationToken cancellationToken)
    {
        var settings = _settings.Value;
        ConfigureAccessToken(settings);

        if (!string.IsNullOrWhiteSpace(pago.MercadoPagoPreferenceId))
        {
            var preference = await TryGetPreferenceAsync(pago.MercadoPagoPreferenceId, cancellationToken);
            if (preference != null && PreferenceMatchesAmount(preference, pago.SaldoPendiente()))
            {
                var existingUrl = SelectPaymentUrl(preference, settings.UseSandbox);
                if (!string.IsNullOrWhiteSpace(existingUrl))
                {
                    return new MercadoPagoLinkResult(
                        preference.Id ?? pago.MercadoPagoPreferenceId,
                        preference.InitPoint,
                        preference.SandboxInitPoint,
                        existingUrl!,
                        CreatedNew: false);
                }
            }
        }

        var request = BuildPreferenceRequest(pago, titular, settings);
        var client = new PreferenceClient();
        var created = await client.CreateAsync(request, cancellationToken: cancellationToken);

        var createdUrl = SelectPaymentUrl(created, settings.UseSandbox) ?? string.Empty;
        return new MercadoPagoLinkResult(
            created.Id ?? string.Empty,
            created.InitPoint,
            created.SandboxInitPoint,
            createdUrl,
            CreatedNew: true);
    }

    public async Task<MercadoPagoPaymentInfo?> GetPaymentAsync(long paymentId, CancellationToken cancellationToken)
    {
        var settings = _settings.Value;
        ConfigureAccessToken(settings);

        var client = new PaymentClient();
        Payment? payment;

        try
        {
            payment = await client.GetAsync(paymentId, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo pago Mercado Pago {PaymentId}", paymentId);
            throw;
        }

        if (payment == null)
            return null;

        var amount = payment.TransactionAmount ?? 0m;

        return new MercadoPagoPaymentInfo(
            payment.Id ?? paymentId,
            payment.Status ?? string.Empty,
            payment.ExternalReference,
            amount,
            payment.DateApproved,
            payment.CurrencyId);
    }

    private static void ConfigureAccessToken(MercadoPagoSettings settings)
    {
        var token = settings.UseSandbox ? settings.AccessTokenSandbox : settings.AccessTokenProd;
        if (string.IsNullOrWhiteSpace(token))
            throw new InvalidOperationException("No hay token de Mercado Pago configurado");

        MercadoPagoConfig.AccessToken = token;
    }

    private async Task<Preference?> TryGetPreferenceAsync(string preferenceId, CancellationToken cancellationToken)
    {
        var client = new PreferenceClient();
        try
        {
            return await client.GetAsync(preferenceId, cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo recuperar preferencia {PreferenceId}", preferenceId);
            return null;
        }
    }

    private static bool PreferenceMatchesAmount(Preference preference, decimal saldoPendiente)
    {
        if (preference.Items == null || preference.Items.Count == 0)
            return false;

        var item = preference.Items.First();
        if (item.UnitPrice == null)
            return false;

        var unitPrice = item.UnitPrice.Value;
        return unitPrice == decimal.Round(saldoPendiente, 2, MidpointRounding.AwayFromZero);
    }

    private PreferenceRequest BuildPreferenceRequest(PagoMensual pago, Titular titular, MercadoPagoSettings settings)
    {
        var saldo = pago.SaldoPendiente();
        if (saldo <= 0)
            throw new InvalidOperationException("El pago mensual no tiene saldo pendiente");

        if (string.IsNullOrWhiteSpace(settings.WebhookBaseUrl))
            throw new InvalidOperationException("WebhookBaseUrl no esta configurado");

        var notificationUrl = BuildWebhookUrl(settings.WebhookBaseUrl);

        var itemTitle = $"Cuota {pago.Mes:D2}/{pago.Anio} - {titular.NombreContacto}";

        var request = new PreferenceRequest
        {
            ExternalReference = pago.Id.ToString(CultureInfo.InvariantCulture),
            NotificationUrl = notificationUrl,
            AutoReturn = "approved",
            StatementDescriptor = "Transporte Escolar",
            Items = new List<PreferenceItemRequest>
            {
                new()
                {
                    Title = itemTitle,
                    Quantity = 1,
                    CurrencyId = "ARS",
                    UnitPrice = decimal.Round(saldo, 2, MidpointRounding.AwayFromZero)
                }
            },
            Payer = BuildPayerRequest(titular),
            PaymentMethods = new PreferencePaymentMethodsRequest
            {
                ExcludedPaymentTypes = new List<PreferencePaymentTypeRequest>
                {
                    new() { Id = "ticket" },
                    new() { Id = "atm" }
                }
            }
        };

        var backUrls = BuildBackUrls(settings.WebhookBaseUrl!, settings);
        request.BackUrls = backUrls.Request;

        _logger.LogInformation(
            "BackUrls Mercado Pago configuradas success={SuccessConfigured} pending={PendingConfigured} failure={FailureConfigured}",
            backUrls.HasSuccess,
            backUrls.HasPending,
            backUrls.HasFailure);

        return request;
    }

    private static PreferencePayerRequest BuildPayerRequest(Titular titular)
    {
        var payer = new PreferencePayerRequest
        {
            Name = titular.NombreContacto,
            Surname = titular.Apellido
        };

        var telefono = titular.Telefonos.FirstOrDefault(t => t.EsPrincipal && t.FechaBaja == null)
                       ?? titular.Telefonos.FirstOrDefault(t => t.FechaBaja == null);

        if (telefono != null)
        {
            payer.Phone = new PhoneRequest
            {
                Number = telefono.NumeroE164
            };
        }

        return payer;
    }

    private static string BuildWebhookUrl(string baseUrl)
    {
        var trimmed = baseUrl.TrimEnd('/');
        return $"{trimmed}/api/webhooks/mercadopago";
    }

    private static BackUrlsConfiguration BuildBackUrls(string webhookBaseUrl, MercadoPagoSettings settings)
    {
        var successUrl = BuildAbsoluteUrl(settings.ReturnUrlSuccess, webhookBaseUrl);
        if (string.IsNullOrWhiteSpace(successUrl))
            throw new InvalidOperationException("Configurar MercadoPago: ReturnUrlSuccess");

        var pendingUrl = BuildAbsoluteUrl(settings.ReturnUrlPending, webhookBaseUrl);
        var failureUrl = BuildAbsoluteUrl(settings.ReturnUrlFailure, webhookBaseUrl);

        var request = new PreferenceBackUrlsRequest
        {
            Success = successUrl,
            Pending = pendingUrl,
            Failure = failureUrl
        };

        return new BackUrlsConfiguration(
            request,
            HasSuccess: true,
            HasPending: !string.IsNullOrWhiteSpace(pendingUrl),
            HasFailure: !string.IsNullOrWhiteSpace(failureUrl));
    }

    private static string? BuildAbsoluteUrl(string? candidate, string baseUrl)
    {
        if (string.IsNullOrWhiteSpace(candidate))
            return null;

        if (Uri.TryCreate(candidate, UriKind.Absolute, out var absolute))
            return absolute.AbsoluteUri;

        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var baseUri))
            throw new InvalidOperationException("WebhookBaseUrl no es una url valida");

        if (Uri.TryCreate(baseUri, candidate, out var combined))
            return combined.AbsoluteUri;

        throw new InvalidOperationException("No se pudo componer url absoluta para Mercado Pago");
    }

    private static string? SelectPaymentUrl(Preference preference, bool useSandbox)
    {
        if (useSandbox)
            return preference.SandboxInitPoint ?? preference.InitPoint;

        return preference.InitPoint ?? preference.SandboxInitPoint;
    }

    private sealed record BackUrlsConfiguration(
        PreferenceBackUrlsRequest Request,
        bool HasSuccess,
        bool HasPending,
        bool HasFailure);
}
