using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Gestiona el envío masivo de recordatorios de pago por WhatsApp.
/// </summary>
[ApiController]
[Route("api/whatsapp/lotes")]
public class WhatsAppLoteController : ControllerBase
{
    private readonly IWhatsAppLoteService _service;
    private readonly ILogger<WhatsAppLoteController> _logger;

    public WhatsAppLoteController(IWhatsAppLoteService service, ILogger<WhatsAppLoteController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Crea un lote de mensajes WhatsApp y lo envía en background.
    /// Retorna 202 Accepted con el ID del lote para consulta posterior.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<WhatsAppLoteModel.Response>> CrearLote(
        [FromBody] WhatsAppLoteModel.CrearRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Iniciando lote WhatsApp: {Descripcion}", request.Descripcion);

        var lote = await _service.CrearYEncolarLoteAsync(request, cancellationToken);

        // El procesamiento corre en background: vamos a procesarlo en forma "fire and forget" controlada
        // Lanzamos el procesamiento de forma asíncrona sin bloquear la respuesta HTTP
        _ = Task.Run(async () =>
        {
            try
            {
                await _service.ProcesarLoteAsync(lote.LoteId, CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar Lote #{LoteId} en background", lote.LoteId);
            }
        });

        return Accepted($"api/whatsapp/lotes/{lote.LoteId}", lote);
    }

    /// <summary>
    /// Consulta el estado actual de un lote. Úsalo para polling desde el frontend.
    /// </summary>
    [HttpGet("{loteId:int}")]
    public async Task<ActionResult<WhatsAppLoteModel.EstadoResponse>> ObtenerEstado(
        int loteId,
        CancellationToken cancellationToken)
    {
        try
        {
            var estado = await _service.ObtenerEstadoLoteAsync(loteId, cancellationToken);
            return Ok(estado);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { mensaje = $"Lote #{loteId} no encontrado" });
        }
    }
}
