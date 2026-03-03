using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionService _service;
    private readonly ILogger<NotificacionesController> _logger;

    public NotificacionesController(INotificacionService service, ILogger<NotificacionesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene las notificaciones paginadas
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginationModel.ResponsePagination<NotificacionModel.Response>>> GetPaginadas(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool soloNoLeidas = false)
    {
        var request = new NotificacionModel.FilterRequest(pageNumber, pageSize, soloNoLeidas);
        var result = await _service.ObtenerPaginadasAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el conteo de notificaciones no leídas
    /// </summary>
    [HttpGet("no-leidas/count")]
    public async Task<ActionResult<NotificacionModel.CountResponse>> GetCountNoLeidas()
    {
        var result = await _service.ObtenerCountNoLeidasAsync();
        return Ok(result);
    }

    /// <summary>
    /// Registra o actualiza la última notificación de actualización de producto (se conserva un solo registro)
    /// </summary>
    [HttpPut("ultima-actualizacion")]
    public async Task<ActionResult<NotificacionModel.Response>> GuardarUltimaActualizacion(
        [FromBody] NotificacionModel.ActualizacionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _service.GuardarActualizacionProductoAsync(request, cancellationToken);
        _logger.LogInformation("Notificación de actualización de producto publicada {Fecha}", result.FechaPublicacion);
        return Ok(result);
    }

    /// <summary>
    /// Marca una notificación como leída
    /// </summary>
    [HttpPut("{id}/marcar-leida")]
    public async Task<ActionResult> MarcarComoLeida(int id)
    {
        await _service.MarcarComoLeidaAsync(id);
        _logger.LogInformation("Notificación {Id} marcada como leída", id);
        return NoContent();
    }

    /// <summary>
    /// Marca todas las notificaciones como leídas
    /// </summary>
    [HttpPut("marcar-todas-leidas")]
    public async Task<ActionResult> MarcarTodasComoLeidas()
    {
        await _service.MarcarTodasComoLeidasAsync();
        _logger.LogInformation("Todas las notificaciones marcadas como leídas");
        return NoContent();
    }

    /// <summary>
    /// Elimina una notificación
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        _logger.LogInformation("Notificación {Id} eliminada", id);
        return NoContent();
    }

    /// <summary>
    /// Limpia notificaciones antiguas (leídas > 7 días, no leídas > 30 días)
    /// </summary>
    [HttpPost("limpiar")]
    public async Task<ActionResult<object>> LimpiarAntiguas(CancellationToken cancellationToken)
    {
        var eliminadas = await _service.LimpiarNotificacionesAntiguasAsync(cancellationToken);
        _logger.LogInformation("Limpieza de notificaciones: {Eliminadas} eliminadas", eliminadas);
        return Ok(new { eliminadas });
    }
}
