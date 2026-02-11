using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagosMensualesController : ControllerBase
{
    private readonly IPagoMensualService _service;
    private readonly ILogger<PagosMensualesController> _logger;

    public PagosMensualesController(
        IPagoMensualService service,
        ILogger<PagosMensualesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los pagos mensuales
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetAll()
    {
        var dtos = await _service.ObtenerTodosAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pagos vencidos
    /// </summary>
    [HttpGet("vencidos")]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetVencidos()
    {
        var dtos = await _service.ObtenerVencidosAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pagos pendientes
    /// </summary>
    [HttpGet("pendientes")]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetPendientes()
    {
        var dtos = await _service.ObtenerPendientesAsync();
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pagos mensuales paginados filtrados por mes/año
    /// </summary>
    [HttpGet("paginados")]
    public async Task<ActionResult<PaginationModel.ResponsePagination<PagoMensualModel.Response>>> GetPaginados(
        [FromQuery] int mes,
        [FromQuery] int anio,
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var request = new PagoMensualModel.FilterRequest(mes, anio, search, pageNumber, pageSize);
        var resultado = await _service.ObtenerPaginadosAsync(request);
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene estadísticas del mes seleccionado
    /// </summary>
    [HttpGet("estadisticas")]
    public async Task<ActionResult<PagoMensualModel.EstadisticasMes>> GetEstadisticas(
        [FromQuery] int mes,
        [FromQuery] int anio)
    {
        var estadisticas = await _service.ObtenerEstadisticasMesAsync(mes, anio);
        return Ok(estadisticas);
    }

    /// <summary>
    /// Obtiene titulares con pagos mensuales generados
    /// </summary>
    [HttpGet("titulares-con-pagos")]
    public async Task<ActionResult<PaginationModel.ResponsePagination<TitularModel.Response>>> GetTitularesConPagos(
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        if (pageNumber <= 0 || pageSize <= 0)
            return BadRequest("pageNumber y pageSize deben ser mayores a 0.");

        var request = new PaginationModel.FilterRequest(search, pageNumber, pageSize);
        var resultado = await _service.ObtenerTitularesConPagosAsync(request);
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene el historial paginado de movimientos registrados
    /// </summary>
    [HttpGet("movimientos")]
    public async Task<ActionResult<PaginationModel.ResponsePagination<PagoMovimientoModel.Response>>> GetMovimientos(
        [FromQuery] DateOnly? fechaDesde,
        [FromQuery] DateOnly? fechaHasta,
        [FromQuery] int? titularId,
        [FromQuery] string? medioPago,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        if (pageNumber <= 0 || pageSize <= 0)
            return BadRequest("pageNumber y pageSize deben ser mayores a 0.");

        var request = new PagoMovimientoModel.FilterRequest(
            fechaDesde,
            fechaHasta,
            titularId,
            medioPago,
            pageNumber,
            pageSize);

        var resultado = await _service.ObtenerMovimientosAsync(request);
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene pagos por titular
    /// </summary>
    [HttpGet("titular/{titularId}")]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetByTitular(int titularId)
    {
        var dtos = await _service.ObtenerPorTitularAsync(titularId);
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene un pago mensual por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PagoMensualModel.Response>> GetById(int id)
    {
        var dto = await _service.ObtenerPorIdAsync(id);
        
        if (dto == null)
            return NotFound();

        return Ok(dto);
    }

    /// <summary>
    /// Crea un nuevo pago mensual
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PagoMensualModel.Response>> Create([FromBody] PagoMensualModel.Request dto)
    {
        var resultado = await _service.CrearAsync(dto);

        _logger.LogInformation("Pago mensual creado: {Periodo} - Titular {TitularId} (ID: {Id})", 
            resultado.Periodo, resultado.TitularId, resultado.Id);

        return CreatedAtAction(
            nameof(GetById),
            new { id = resultado.Id },
            resultado);
    }

    /// <summary>
    /// Registra un pago/movimiento en un pago mensual
    /// </summary>
    [HttpPost("{id}/registrar-pago")]
    public async Task<ActionResult> RegistrarPago(int id, [FromBody] PagoMensualModel.RegistrarPagoRequest dto)
    {
        await _service.RegistrarPagoAsync(id, dto);

        _logger.LogInformation("Pago registrado en pago mensual (ID: {Id}), Monto: {Monto}", id, dto.Monto);

        return NoContent();
    }

    /// <summary>
    /// Actualiza observaciones de un pago mensual
    /// </summary>
    [HttpPut("{id}/observaciones")]
    public async Task<ActionResult> ActualizarObservaciones(int id, [FromBody] PagoMensualModel.UpdateObservacionesRequest dto)
    {
        await _service.ActualizarObservacionesAsync(id, dto);

        _logger.LogInformation("Observaciones actualizadas en pago mensual (ID: {Id})", id);

        return NoContent();
    }
}
