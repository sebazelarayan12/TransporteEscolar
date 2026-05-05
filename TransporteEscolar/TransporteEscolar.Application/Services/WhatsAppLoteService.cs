using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

/// <summary>
/// Orquesta la creación y el envío de lotes de mensajes WhatsApp.
/// El método <see cref="ProcesarLoteAsync"/> se invoca desde un BackgroundService.
/// </summary>
public class WhatsAppLoteService : IWhatsAppLoteService
{
    private readonly IWhatsAppLoteRepository _repository;
    private readonly IWhatsAppProvider _whatsAppProvider;
    private readonly WhatsAppTemplateName _templateOptions;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly ITitularRepository _titularRepository;
    private readonly IMercadoPagoService _mercadoPagoService;
    private readonly ILogger<WhatsAppLoteService> _logger;

    public WhatsAppLoteService(
        IWhatsAppLoteRepository repository,
        IWhatsAppProvider whatsAppProvider,
        IOptions<WhatsAppTemplateName> templateOptions,
        IPagoMensualRepository pagoMensualRepository,
        ITitularRepository titularRepository,
        IMercadoPagoService mercadoPagoService,
        ILogger<WhatsAppLoteService> logger)
    {
        _repository = repository;
        _whatsAppProvider = whatsAppProvider;
        _templateOptions = templateOptions.Value;
        _pagoMensualRepository = pagoMensualRepository;
        _titularRepository = titularRepository;
        _mercadoPagoService = mercadoPagoService;
        _logger = logger;
    }

    // ── Crear lote ─────────────────────────────────────────────────────────

    public async Task<WhatsAppLoteModel.Response> CrearYEncolarLoteAsync(
        WhatsAppLoteModel.CrearRequest request,
        CancellationToken cancellationToken = default)
    {
        var titulares = await _repository.ObtenerTitularesActivosConTelefonoAsync(
            request.TitularIds, cancellationToken);

        if (titulares.Count == 0)
            throw new InvalidOperationException(
                "No se encontraron titulares activos con teléfono principal para notificar.");

        var lote = new LoteWhatsApp("CobroMensual", request.Descripcion);
        await _repository.CrearLoteAsync(lote, cancellationToken);

        var mensajes = titulares.Select(t => new MensajeWhatsApp(
            loteId: lote.Id,
            titularId: t.TitularId,
            telefonoDestino: t.TelefonoPrincipal,
            nombreTitular: $"{t.NombreContacto} {t.Apellido}")).ToList();

        await _repository.AgregarMensajesAsync(mensajes, cancellationToken);

        _logger.LogInformation("Lote WhatsApp #{LoteId} creado con {Total} mensajes", lote.Id, mensajes.Count);

        return new WhatsAppLoteModel.Response(
            LoteId: lote.Id,
            Estado: lote.Estado,
            TotalMensajes: mensajes.Count,
            FechaCreacion: lote.FechaCreacion);
    }

    // ── Procesar lote ──────────────────────────────────────────────────────

    public async Task ProcesarLoteAsync(int loteId, CancellationToken cancellationToken = default)
    {
        var lote = await _repository.ObtenerLotePorIdAsync(loteId, cancellationToken);
        if (lote is null)
        {
            _logger.LogWarning("ProcesarLoteAsync: Lote #{LoteId} no encontrado", loteId);
            return;
        }

        lote.IniciarProcesamiento();
        await _repository.ActualizarLoteAsync(lote, cancellationToken);

        var pendientes = await _repository.ObtenerMensajesPendientesPorLoteAsync(loteId, cancellationToken);
        _logger.LogInformation("Procesando {Count} mensajes del Lote #{LoteId}", pendientes.Count, loteId);

        var hoy = DateTime.UtcNow.AddHours(-3);
        var mesActual = hoy.Month;
        var anioActual = hoy.Year;
        var fechaLimiteStr = new DateTime(hoy.Year, hoy.Month,
            DateTime.DaysInMonth(hoy.Year, hoy.Month)).ToString("dd/MM/yyyy");

        var titularIds = pendientes.Select(m => m.TitularId).Distinct().ToList();

        var titularesProjection = await _repository.ObtenerTitularesActivosConTelefonoAsync(titularIds, cancellationToken);
        var montosPorTitular = titularesProjection.ToDictionary(t => t.TitularId, t => t.MontoMensualPactado);

        var linksPorTitular = await GenerarLinksMercadoPagoAsync(
            titularIds, mesActual, anioActual, cancellationToken);

        foreach (var mensaje in pendientes)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var monto = montosPorTitular.TryGetValue(mensaje.TitularId, out var m) ? m : 0m;
            string[] parametros;

            if (linksPorTitular.TryGetValue(mensaje.TitularId, out var link))
                parametros = [mensaje.NombreTitular, monto.ToString("N0"), fechaLimiteStr, link];
            else
                parametros = [mensaje.NombreTitular, monto.ToString("N0"), fechaLimiteStr];

            var resultado = await _whatsAppProvider.EnviarTemplateMensajeAsync(
                telefono: mensaje.TelefonoDestino,
                templateName: _templateOptions.Name,
                parameters: parametros,
                cancellationToken: cancellationToken);

            if (resultado.Exitoso)
                mensaje.MarcarEnviado(resultado.MessageId!);
            else
                mensaje.MarcarError(resultado.ErrorDetalle ?? "Error desconocido");

            await _repository.ActualizarMensajeAsync(mensaje, cancellationToken);

            await Task.Delay(250, cancellationToken);
        }

        var stats = await _repository.ObtenerEstadisticasLoteAsync(loteId, cancellationToken);
        _ = stats; // los errores se ven en el detalle del lote
        lote.Completar();

        await _repository.ActualizarLoteAsync(lote, cancellationToken);
        _logger.LogInformation("Lote #{LoteId} finalizado. Estado: {Estado}", loteId, lote.Estado);
    }

    // ── Estado del lote ────────────────────────────────────────────────────

    public async Task<WhatsAppLoteModel.EstadoResponse> ObtenerEstadoLoteAsync(
        int loteId, CancellationToken cancellationToken = default)
    {
        var lote = await _repository.ObtenerLotePorIdAsync(loteId, cancellationToken)
            ?? throw new KeyNotFoundException($"Lote #{loteId} no encontrado");

        var stats = await _repository.ObtenerEstadisticasLoteAsync(loteId, cancellationToken);

        return new WhatsAppLoteModel.EstadoResponse(
            LoteId:            loteId,
            Estado:            lote.Estado,
            Total:             stats.Total,
            Enviados:          stats.Enviados,
            Entregados:        stats.Entregados,
            Leidos:            stats.Leidos,
            Errores:           stats.Errores,
            Pendientes:        stats.Pendientes,
            FechaCreacion:     lote.FechaCreacion,
            FechaFinalizacion: lote.FechaFinalizacion);
    }

    // ── Webhook ────────────────────────────────────────────────────────────

    public async Task ProcesarWebhookStatusAsync(
        string providerMessageId, string nuevoEstado, CancellationToken cancellationToken = default)
    {
        var mensaje = await _repository.ObtenerMensajePorProviderIdAsync(providerMessageId, cancellationToken);
        if (mensaje is null)
        {
            _logger.LogWarning("Webhook: ProviderMessageId {Id} no encontrado", providerMessageId);
            return;
        }

        switch (nuevoEstado.ToLowerInvariant())
        {
            case "delivered": mensaje.MarcarEntregado(); break;
            case "read":      mensaje.MarcarLeido();     break;
            case "failed":    mensaje.MarcarError("Meta reportó fallo definitivo"); break;
            default:
                _logger.LogDebug("Webhook: estado ignorado '{Estado}'", nuevoEstado);
                return;
        }

        await _repository.ActualizarMensajeAsync(mensaje, cancellationToken);
    }

    // ── Generación de links Mercado Pago ───────────────────────────────────

    private async Task<Dictionary<int, string>> GenerarLinksMercadoPagoAsync(
        List<int> titularIds,
        int mes,
        int anio,
        CancellationToken cancellationToken)
    {
        var links = new Dictionary<int, string>();

        List<PagoMensual> pagos;
        List<Titular> titulares;

        try
        {
            pagos = await _pagoMensualRepository.GetByMesAnioAsync(mes, anio, cancellationToken);
            titulares = await _titularRepository.GetByIdsAsync(titularIds, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error cargando datos para links Mercado Pago");
            return links;
        }

        var pagosPorTitular = pagos
            .Where(p => !p.EstaPagado() && p.SaldoPendiente() > 0)
            .GroupBy(p => p.TitularId)
            .ToDictionary(g => g.Key, g => g.First());

        var titularesPorId = titulares.ToDictionary(t => t.Id);

        foreach (var titularId in titularIds)
        {
            if (!pagosPorTitular.TryGetValue(titularId, out var pago)) continue;
            if (!titularesPorId.TryGetValue(titularId, out var titular)) continue;

            try
            {
                var linkResult = await _mercadoPagoService.GetOrCreatePreferenceAsync(
                    pago, cancellationToken);

                pago.AsignarMercadoPagoLink(linkResult.PreferenceId, linkResult.PaymentUrl, DateTime.UtcNow);
                if (linkResult.CreatedNew)
                    pago.LimpiarMercadoPagoPayment();

                await _pagoMensualRepository.UpdateAsync(pago, cancellationToken);

                links[titularId] = linkResult.PaymentUrl;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "No se pudo generar link Mercado Pago para titular {TitularId}", titularId);
            }
        }

        return links;
    }
}

/// <summary>Opciones de nombre de plantilla, separadas de las opciones de Meta para no romper la inyección.</summary>
public class WhatsAppTemplateName
{
    public const string SectionName = "MetaWhatsApp";
    public string Name { get; set; } = string.Empty;
}
