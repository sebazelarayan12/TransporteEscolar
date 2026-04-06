using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;

namespace TransporteEscolar.Application.Services;

public class WebPushService : IWebPushService
{
    private readonly IPushSubscriptionRepository _repository;
    private readonly VapidSettings _vapidSettings;
    private readonly ILogger<WebPushService> _logger;
    private readonly PushServiceClient _pushClient;

    public WebPushService(
        IPushSubscriptionRepository repository,
        IOptions<VapidSettings> vapidSettings,
        ILogger<WebPushService> logger)
    {
        _repository = repository;
        _vapidSettings = vapidSettings.Value;
        _logger = logger;

        _pushClient = new PushServiceClient
        {
            DefaultAuthentication = new VapidAuthentication(
                _vapidSettings.PublicKey,
                _vapidSettings.PrivateKey)
            {
                Subject = _vapidSettings.Subject
            }
        };
    }

    public string ObtenerClavePublicaVapid()
    {
        return _vapidSettings.PublicKey;
    }

    public async Task EnviarATodosAsync(string titulo, string mensaje, string? url = null, CancellationToken cancellationToken = default)
    {
        var suscripciones = await _repository.GetAllAsync(cancellationToken);

        if (suscripciones.Count == 0)
        {
            _logger.LogDebug("No hay suscripciones push registradas, omitiendo envio");
            return;
        }

        var payload = JsonSerializer.Serialize(new
        {
            title = titulo,
            body = mensaje,
            url = url,
            icon = "/transporteicon.svg",
            badge = "/transporteicon.svg"
        });

        var tareas = suscripciones.Select(async suscripcion =>
        {
            try
            {
                var pushSubscription = new Lib.Net.Http.WebPush.PushSubscription
                {
                    Endpoint = suscripcion.Endpoint,
                    Keys = new Dictionary<string, string>
                    {
                        { "p256dh", suscripcion.P256dh },
                        { "auth", suscripcion.Auth }
                    }
                };

                var pushMessage = new PushMessage(payload)
                {
                    Urgency = PushMessageUrgency.High
                };

                await _pushClient.RequestPushMessageDeliveryAsync(pushSubscription, pushMessage, cancellationToken);

                suscripcion.ActualizarUltimoUso();
                await _repository.UpdateAsync(suscripcion, cancellationToken);
            }
            catch (PushServiceClientException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("Suscripcion push expirada, eliminando endpoint {Endpoint}", suscripcion.Endpoint);
                await _repository.DeleteAsync(suscripcion.Id, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al enviar push a endpoint {Endpoint}", suscripcion.Endpoint);
            }
        });

        await Task.WhenAll(tareas);
        _logger.LogInformation("Push enviado a {Count} suscripciones", suscripciones.Count);
    }
}
