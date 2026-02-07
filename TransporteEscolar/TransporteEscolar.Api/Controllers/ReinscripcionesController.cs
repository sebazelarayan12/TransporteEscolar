using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReinscripcionesController : ControllerBase
{
    private readonly IReinscripcionService _service;
    private readonly ILogger<ReinscripcionesController> _logger;

    public ReinscripcionesController(
        IReinscripcionService service,
        ILogger<ReinscripcionesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todas las reinscripciones de un año específico
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ReinscripcionModel.ResponseDetallada>>> GetAll([FromQuery] int anio = 2024)
    {
        var dtos = await _service.ObtenerTodosAsync(anio);
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene una reinscripción por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ReinscripcionModel.ResponseDetallada>> GetById(int id)
    {
        try
        {
            var dto = await _service.ObtenerPorIdAsync(id);
            return Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Crea una nueva reinscripción
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReinscripcionModel.ResponseDetallada>> Create([FromBody] ReinscripcionModel.Request request)
    {
        try
        {
            var resultado = await _service.CrearAsync(request.PasajeroId, request.Anio);

            _logger.LogInformation(
                "Reinscripción creada: Año {Anio} - Pasajero {PasajeroId} (ID: {Id})",
                resultado.Anio,
                resultado.PasajeroId,
                resultado.Id
            );

            return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Confirma una reinscripción (cambia estado a "Confirmado")
    /// </summary>
    [HttpPatch("{id}/confirmar")]
    public async Task<ActionResult> Confirmar(int id)
    {
        try
        {
            await _service.ConfirmarAsync(id);
            _logger.LogInformation("Reinscripción confirmada (ID: {Id})", id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Marca una reinscripción como "No Continúa"
    /// </summary>
    [HttpPatch("{id}/no-continua")]
    public async Task<ActionResult> MarcarComoNoContinua(int id)
    {
        try
        {
            await _service.MarcarComoNoContinuaAsync(id);
            _logger.LogInformation("Reinscripción marcada como no continúa (ID: {Id})", id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
