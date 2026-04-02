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
    private static readonly string[] EstadosPermitidos = new[] { "Pendiente", "Confirmado", "NoContinua" };

    public ReinscripcionesController(
        IReinscripcionService service,
        ILogger<ReinscripcionesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene reinscripciones filtradas y paginadas por año, mes y estado
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginationModel.ResponsePagination<ReinscripcionModel.ResponseDetallada>>> GetAll(
        [FromQuery] int anio = 2024,
        [FromQuery] string? estado = null,
        [FromQuery] int? mes = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        if (!EsEstadoValido(estado, out var estadoNormalizado))
            return BadRequest($"Estado invalido: {estado}");

        var mesFiltrado = mes;

        if (mesFiltrado.HasValue)
        {
            if (mesFiltrado.Value < 1 || mesFiltrado.Value > 12)
                return BadRequest("mes debe estar entre 1 y 12");
        }

        if (pageNumber < 1)
            return BadRequest("pageNumber debe ser mayor o igual a 1");

        if (pageSize < 1 || pageSize > 100)
            return BadRequest("pageSize debe estar entre 1 y 100");

        var request = new ReinscripcionModel.FilterRequest(anio, estadoNormalizado, mesFiltrado, pageNumber, pageSize);

        try
        {
            var dtos = await _service.ObtenerTodosAsync(request);
            return Ok(dtos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Obtiene alertas para pagos según el estado de las reinscripciones
    /// </summary>
    [HttpGet("alertas-pagos")]
    public async Task<ActionResult<ReinscripcionModel.AlertasPagoResponse>> GetAlertasPagos([FromQuery] int? anio = null)
    {
        var anioObjetivo = anio ?? DateTime.UtcNow.Year;

        if (anioObjetivo <= 0)
            return BadRequest("anio debe ser mayor a 0");

        try
        {
            var resultado = await _service.ObtenerAlertasPagoAsync(anioObjetivo);
            return Ok(resultado);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(ex.Message);
        }
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
    /// Obtiene el precio estimado que se usará al confirmar la reinscripción.
    /// </summary>
    [HttpGet("{id}/precio-previo")]
    public async Task<ActionResult<ReinscripcionModel.PrecioPrevioResponse>> GetPrecioPrevio(int id)
    {
        try
        {
            var dto = await _service.ObtenerPrecioPrevioAsync(id);
            return Ok(dto);
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

    /// <summary>
    /// Marca una reinscripción como "Pendiente"
    /// </summary>
    [HttpPatch("{id}/pendiente")]
    public async Task<ActionResult> MarcarComoPendiente(int id)
    {
        try
        {
            await _service.MarcarComoPendienteAsync(id);
            _logger.LogInformation("Reinscripción marcada como pendiente (ID: {Id})", id);
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

    private static bool EsEstadoValido(string? estado, out string? estadoNormalizado)
    {
        estadoNormalizado = null;

        if (string.IsNullOrWhiteSpace(estado))
            return true;

        foreach (var permitido in EstadosPermitidos)
        {
            if (string.Equals(permitido, estado, StringComparison.OrdinalIgnoreCase))
            {
                estadoNormalizado = permitido;
                return true;
            }
        }

        return false;
    }
}
