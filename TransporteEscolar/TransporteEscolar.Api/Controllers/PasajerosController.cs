using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PasajerosController : ControllerBase
{
    private readonly IPasajeroService _service;
    private readonly ILogger<PasajerosController> _logger;

    public PasajerosController(
        IPasajeroService service,
        ILogger<PasajerosController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los pasajeros
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PasajeroModel.Response>>> GetAll()
    {
        var dtos = await _service.ObtenerTodosAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene solo pasajeros activos
    /// </summary>
    [HttpGet("activos")]
    public async Task<ActionResult<List<PasajeroModel.Response>>> GetActivos()
    {
        var dtos = await _service.ObtenerActivosAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pasajeros activos sin reinscripción confirmada para el año indicado
    /// </summary>
    [HttpGet("activos-disponibles")]
    public async Task<ActionResult<List<PasajeroModel.Response>>> GetActivosDisponibles([FromQuery] int anio)
    {
        if (anio <= 0)
            return BadRequest("anio es obligatorio");

        var dtos = await _service.ObtenerActivosDisponiblesParaReinscripcionAsync(anio);
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pasajeros activos con paginación y filtros
    /// </summary>
    [HttpGet("paginados")]
    public async Task<ActionResult<PaginationModel.ResponsePagination<PasajeroModel.Response>>> GetPaginados(
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var request = new PaginationModel.FilterRequest(search, pageNumber, pageSize);
        var resultado = await _service.ObtenerPaginadosAsync(request);
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene pasajeros por titular
    /// </summary>
    [HttpGet("titular/{titularId}")]
    public async Task<ActionResult<List<PasajeroModel.Response>>> GetByTitular(int titularId)
    {
        var dtos = await _service.ObtenerPorTitularAsync(titularId);
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene un pasajero por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PasajeroModel.Response>> GetById(int id)
    {
        var dto = await _service.ObtenerPorIdAsync(id);
        
        if (dto == null)
            return NotFound();

        return Ok(dto);
    }

    /// <summary>
    /// Crea un nuevo pasajero
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PasajeroModel.Response>> Create([FromBody] PasajeroModel.Request dto)
    {
        var resultado = await _service.CrearAsync(dto);

        _logger.LogInformation("Pasajero creado: {NombreCompleto} (ID: {Id})", 
            resultado.NombreCompleto, resultado.Id);

        return CreatedAtAction(
            nameof(GetById),
            new { id = resultado.Id },
            resultado);
    }

    /// <summary>
    /// Actualiza datos de un pasajero existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] PasajeroModel.UpdateRequest dto)
    {
        await _service.ActualizarAsync(id, dto);

        _logger.LogInformation("Pasajero actualizado (ID: {Id})", id);

        return NoContent();
    }

    /// <summary>
    /// Dar de baja un pasajero (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DarDeBaja(int id)
    {
        await _service.DarDeBajaAsync(id);

        _logger.LogInformation("Pasajero dado de baja (ID: {Id})", id);

        return NoContent();
    }

    /// <summary>
    /// Reactivar un pasajero dado de baja
    /// </summary>
    [HttpPost("{id}/reactivar")]
    public async Task<ActionResult> Reactivar(int id)
    {
        await _service.ReactivarAsync(id);

        _logger.LogInformation("Pasajero reactivado (ID: {Id})", id);

        return NoContent();
    }

    /// <summary>
    /// Quita el horario asignado a un pasajero
    /// </summary>
    [HttpDelete("{id}/horario")]
    public async Task<ActionResult> QuitarHorario(int id)
    {
        await _service.QuitarHorarioAsync(id);

        _logger.LogInformation("Horario removido para el pasajero {Id}", id);

        return NoContent();
    }

    // Endpoints para reinscripciones
    /// <summary>
    /// Obtiene las reinscripciones de un pasajero
    /// </summary>
    [HttpGet("{id}/reinscripciones")]
    public async Task<ActionResult<List<ReinscripcionModel.Response>>> GetReinscripciones(int id)
    {
        var reinscripciones = await _service.ObtenerReinscripcionesAsync(id);
        return Ok(reinscripciones);
    }

    /// <summary>
    /// Crea una reinscripción para un pasajero
    /// </summary>
    [HttpPost("{id}/reinscripciones")]
    public async Task<ActionResult<ReinscripcionModel.Response>> CrearReinscripcion(int id, [FromBody] ReinscripcionModel.Request dto)
    {
        var reinscripcion = await _service.CrearReinscripcionAsync(id, dto);

        _logger.LogInformation("Reinscripción creada para pasajero {PasajeroId}, año {Anio}", id, dto.Anio);

        return Ok(reinscripcion);
    }

    /// <summary>
    /// Confirma una reinscripción
    /// </summary>
    [HttpPut("{id}/reinscripciones/{reinscripcionId}/confirmar")]
    public async Task<ActionResult> ConfirmarReinscripcion(int id, int reinscripcionId)
    {
        await _service.ConfirmarReinscripcionAsync(id, reinscripcionId);

        _logger.LogInformation("Reinscripción {ReinscripcionId} confirmada para pasajero {PasajeroId}", reinscripcionId, id);

        return NoContent();
    }

    /// <summary>
    /// Marca una reinscripción como no continúa
    /// </summary>
    [HttpPut("{id}/reinscripciones/{reinscripcionId}/no-continua")]
    public async Task<ActionResult> MarcarComoNoContinua(int id, int reinscripcionId)
    {
        await _service.MarcarComoNoContinuaAsync(id, reinscripcionId);

        _logger.LogInformation("Reinscripción {ReinscripcionId} marcada como no continúa para pasajero {PasajeroId}", reinscripcionId, id);

        return NoContent();
    }
}
