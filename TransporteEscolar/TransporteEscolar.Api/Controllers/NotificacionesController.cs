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
}
