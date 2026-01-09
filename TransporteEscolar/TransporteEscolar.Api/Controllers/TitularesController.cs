using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TitularesController : ControllerBase
{
    private readonly ITitularRepository _repository;
    private readonly ILogger<TitularesController> _logger;

    public TitularesController(
        ITitularRepository repository,
        ILogger<TitularesController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los titulares
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TitularDto>>> GetAll()
    {
        var titulares = await _repository.GetAllAsync();
        var dtos = titulares.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene solo titulares activos
    /// </summary>
    [HttpGet("activos")]
    public async Task<ActionResult<List<TitularDto>>> GetActivos()
    {
        var titulares = await _repository.GetActivosAsync();
        var dtos = titulares.Select(MapToDto).ToList();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene un titular por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TitularDto>> GetById(int id)
    {
        var titular = await _repository.GetByIdAsync(id);
        
        if (titular == null)
            return NotFound(new { mensaje = $"Titular con ID {id} no encontrado" });

        return Ok(MapToDto(titular));
    }

    /// <summary>
    /// Crea un nuevo titular
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TitularDto>> Create([FromBody] CrearTitularDto dto)
    {
        try
        {
            var titular = new Titular(
                dto.Apellido,
                dto.NombreContacto,
                dto.Direccion,
                dto.MontoMensualPactado);

            await _repository.AddAsync(titular);

            _logger.LogInformation("Titular creado: {Apellido} (ID: {Id})", titular.Apellido, titular.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = titular.Id },
                MapToDto(titular));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    /// <summary>
    /// Actualiza datos de un titular existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] ActualizarTitularDto dto)
    {
        var titular = await _repository.GetByIdAsync(id);
        
        if (titular == null)
            return NotFound(new { mensaje = $"Titular con ID {id} no encontrado" });

        try
        {
            titular.ActualizarDatos(dto.NombreContacto, dto.Direccion);
            titular.ActualizarMontoPactado(dto.MontoMensualPactado);

            await _repository.UpdateAsync(titular);

            _logger.LogInformation("Titular actualizado: {Apellido} (ID: {Id})", titular.Apellido, titular.Id);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    /// <summary>
    /// Dar de baja un titular (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DarDeBaja(int id)
    {
        var titular = await _repository.GetByIdAsync(id);
        
        if (titular == null)
            return NotFound(new { mensaje = $"Titular con ID {id} no encontrado" });

        titular.DarDeBaja();
        await _repository.UpdateAsync(titular);

        _logger.LogInformation("Titular dado de baja: {Apellido} (ID: {Id})", titular.Apellido, titular.Id);

        return NoContent();
    }

    /// <summary>
    /// Reactivar un titular dado de baja
    /// </summary>
    [HttpPost("{id}/reactivar")]
    public async Task<ActionResult> Reactivar(int id)
    {
        var titular = await _repository.GetByIdAsync(id);
        
        if (titular == null)
            return NotFound(new { mensaje = $"Titular con ID {id} no encontrado" });

        titular.Reactivar();
        await _repository.UpdateAsync(titular);

        _logger.LogInformation("Titular reactivado: {Apellido} (ID: {Id})", titular.Apellido, titular.Id);

        return NoContent();
    }

    private static TitularDto MapToDto(Titular titular) => new()
    {
        Id = titular.Id,
        Apellido = titular.Apellido,
        NombreContacto = titular.NombreContacto,
        Direccion = titular.Direccion,
        MontoMensualPactado = titular.MontoMensualPactado,
        FechaAlta = titular.FechaAlta,
        FechaBaja = titular.FechaBaja
    };
}
