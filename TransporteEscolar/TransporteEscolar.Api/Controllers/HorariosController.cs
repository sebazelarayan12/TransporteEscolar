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
    public async Task<ActionResult<List<HorarioModel.Response>>> Get()
    {
        var horarios = await _horarioService.ObtenerHorariosAsync();
        return Ok(horarios);
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

        _logger.LogInformation("Horario {HorarioId} actualizado con {Cantidad} pasajeros", id, request.PasajeroIds?.Count ?? 0);

        return NoContent();
    }
}
