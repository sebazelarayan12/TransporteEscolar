using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TitularesController : ControllerBase
{
    private readonly ITitularService _service;
    private readonly ILogger<TitularesController> _logger;

    public TitularesController(
        ITitularService service,
        ILogger<TitularesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los titulares
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TitularModel.Response>>> GetAll()
    {
        var dtos = await _service.ObtenerTodosAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene solo titulares activos
    /// </summary>
    [HttpGet("activos")]
    public async Task<ActionResult<List<TitularModel.Response>>> GetActivos()
    {
        var dtos = await _service.ObtenerActivosAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene titulares activos con paginación y filtros
    /// </summary>
    [HttpGet("paginados")]
    public async Task<ActionResult<PaginationModel.ResponsePagination<TitularModel.Response>>> GetPaginados(
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var request = new PaginationModel.FilterRequest(search, pageNumber, pageSize);
        var resultado = await _service.ObtenerPaginadosAsync(request);
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene titulares activos para selector (dropdown)
    /// Devuelve: { id, label } donde label = "Apellido - Dirección"
    /// </summary>
    [HttpGet("selector")]
    public async Task<ActionResult<List<object>>> GetSelector()
    {
        var titulares = await _service.ObtenerActivosAsync();
        var selector = titulares.Select(t => new
        {
            id = t.Id,
            label = $"{t.Apellido} - {t.Direccion}"
        }).ToList();
        return Ok(selector);
    }

    /// <summary>
    /// Obtiene un titular por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TitularModel.Response>> GetById(int id)
    {
        var dto = await _service.ObtenerPorIdAsync(id);
        
        if (dto == null)
            return NotFound();

        return Ok(dto);
    }

    /// <summary>
    /// Crea un nuevo titular
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TitularModel.Response>> Create([FromBody] TitularModel.Request dto)
    {
        var resultado = await _service.CrearAsync(dto);

        _logger.LogInformation("Titular creado: {Apellido} (ID: {Id})", resultado.Apellido, resultado.Id);

        return CreatedAtAction(
            nameof(GetById),
            new { id = resultado.Id },
            resultado);
    }

    /// <summary>
    /// Actualiza datos de un titular existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] TitularModel.UpdateRequest dto)
    {
        await _service.ActualizarAsync(id, dto);

        _logger.LogInformation("Titular actualizado (ID: {Id})", id);

        return NoContent();
    }

    /// <summary>
    /// Dar de baja un titular (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DarDeBaja(int id)
    {
        await _service.DarDeBajaAsync(id);

        _logger.LogInformation("Titular dado de baja (ID: {Id})", id);

        return NoContent();
    }

    /// <summary>
    /// Reactivar un titular dado de baja
    /// </summary>
    [HttpPost("{id}/reactivar")]
    public async Task<ActionResult> Reactivar(int id)
    {
        await _service.ReactivarAsync(id);

        _logger.LogInformation("Titular reactivado (ID: {Id})", id);

        return NoContent();
    }

    // Endpoints para teléfonos
    /// <summary>
    /// Obtiene los teléfonos de un titular
    /// </summary>
    [HttpGet("{id}/telefonos")]
    public async Task<ActionResult<List<TelefonoModel.Response>>> GetTelefonos(int id)
    {
        var telefonos = await _service.ObtenerTelefonosAsync(id);
        return Ok(telefonos);
    }

    /// <summary>
    /// Agrega un teléfono a un titular
    /// </summary>
    [HttpPost("{id}/telefonos")]
    public async Task<ActionResult<TelefonoModel.Response>> AgregarTelefono(int id, [FromBody] TelefonoModel.Request dto)
    {
        var telefono = await _service.AgregarTelefonoAsync(id, dto);

        _logger.LogInformation("Teléfono agregado a titular (ID: {Id})", id);

        return Ok(telefono);
    }

    /// <summary>
    /// Actualiza un teléfono existente
    /// </summary>
    [HttpPut("{id}/telefonos/{telefonoId}")]
    public async Task<ActionResult> ActualizarTelefono(
        int id, 
        int telefonoId, 
        [FromBody] TelefonoModel.UpdateRequest dto)
    {
        await _service.ActualizarTelefonoAsync(id, telefonoId, dto);

        _logger.LogInformation(
            "Teléfono {TelefonoId} actualizado para titular {TitularId}", 
            telefonoId, id);

        return NoContent();
    }
    /// <summary>
    /// Marca un teléfono como principal
    /// </summary>
    [HttpPut("{id}/telefonos/{telefonoId}/marcar-principal")]
    public async Task<ActionResult> MarcarTelefonoComoPrincipal(int id, int telefonoId)
    {
        await _service.MarcarTelefonoComoPrincipalAsync(id, telefonoId);

        _logger.LogInformation("Teléfono {TelefonoId} marcado como principal para titular {TitularId}", telefonoId, id);

        return NoContent();
    }

    /// <summary>
    /// Elimina (da de baja) un teléfono
    /// </summary>
    [HttpDelete("{id}/telefonos/{telefonoId}")]
    public async Task<ActionResult> EliminarTelefono(int id, int telefonoId)
    {
        await _service.EliminarTelefonoAsync(id, telefonoId);

        _logger.LogInformation("Teléfono {TelefonoId} eliminado del titular {TitularId}", telefonoId, id);

        return NoContent();
    }
}
