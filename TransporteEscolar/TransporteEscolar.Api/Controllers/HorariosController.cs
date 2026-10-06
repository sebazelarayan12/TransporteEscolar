using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HorariosController : ControllerBase
{
    private readonly IHorarioService _horarioService;
    private readonly ILogger<HorariosController> _logger;

    public HorariosController(
        IHorarioService horarioService,
        ILogger<HorariosController> logger)
    {
        _horarioService = horarioService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<HorarioModel.Response>>> Get([FromQuery] bool incluirInactivos = false)
    {
        var horarios = await _horarioService.ObtenerHorariosAsync(incluirInactivos);
        return Ok(horarios);
    }

    [HttpPost]
    public async Task<ActionResult<HorarioModel.Response>> Crear([FromBody] HorarioModel.CrearRequest request)
    {
        var horario = await _horarioService.CrearAsync(request);
        _logger.LogInformation("Horario {HorarioId} creado: {Etiqueta}", horario.Id, horario.Etiqueta);
        return Created($"api/horarios/{horario.Id}", horario);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HorarioModel.Response>> Actualizar(int id, [FromBody] HorarioModel.ActualizarRequest request)
    {
        var horario = await _horarioService.ActualizarAsync(id, request);
        _logger.LogInformation("Horario {HorarioId} actualizado: {Etiqueta}", id, horario.Etiqueta);
        return Ok(horario);
    }

    /// <summary>Baja lógica: el horario se desactiva, nunca se borra.</summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> Desactivar(int id)
    {
        await _horarioService.DesactivarAsync(id);
        _logger.LogInformation("Horario {HorarioId} desactivado", id);
        return NoContent();
    }

    [HttpPost("{id}/reactivar")]
    public async Task<ActionResult> Reactivar(int id)
    {
        await _horarioService.ReactivarAsync(id);
        _logger.LogInformation("Horario {HorarioId} reactivado", id);
        return NoContent();
    }

    [HttpGet("{id}/pasajeros")]
    public async Task<ActionResult<HorarioModel.PasajerosResponse>> GetPasajeros(int id)
    {
        var resultado = await _horarioService.ObtenerPasajerosPorHorarioAsync(id);
        return Ok(resultado);
    }

    [HttpPut("{id}/asignaciones")]
    public async Task<ActionResult> AsignarPasajeros(int id, [FromBody] HorarioModel.AsignacionRequest request)
    {
        await _horarioService.AsignarPasajerosAsync(id, request);

        var total = request?.Pasajeros?.Count ?? request?.PasajeroIds?.Count ?? 0;
        _logger.LogInformation("Horario {HorarioId} actualizado con {Cantidad} pasajeros", id, total);

        return NoContent();
    }
}
