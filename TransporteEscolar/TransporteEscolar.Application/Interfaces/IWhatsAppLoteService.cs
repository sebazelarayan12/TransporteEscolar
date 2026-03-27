using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IWhatsAppLoteService
{
    /// <summary>
    /// Crea un lote de mensajes para todos los titulares activos con saldo pendiente y lo procesa en background.
    /// </summary>
    Task<WhatsAppLoteModel.Response> CrearYEncolarLoteAsync(
        WhatsAppLoteModel.CrearRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Procesa (envía) los mensajes pendientes de un lote. Pensado para ser invocado por Hangfire o BackgroundService.
    /// </summary>
    Task ProcesarLoteAsync(int loteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Retorna el estado actual de un lote (totales, enviados, errores, etc.).
    /// </summary>
    Task<WhatsAppLoteModel.EstadoResponse> ObtenerEstadoLoteAsync(int loteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Actualiza el estado de un mensaje individual a partir de un evento de webhook de Meta.
    /// </summary>
    Task ProcesarWebhookStatusAsync(string providerMessageId, string nuevoEstado, CancellationToken cancellationToken = default);
}
