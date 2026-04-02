using MediatR;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Application.PagosMensuales.Queries;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PagosMensualesController : ControllerBase
{
    private readonly ISender _sender;
    private readonly ILogger<PagosMensualesController> _logger;

    public PagosMensualesController(
        ISender sender,
        ILogger<PagosMensualesController> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los pagos mensuales
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetAll()
    {
        var dtos = await _sender.Send(new GetPagosMensualesQuery());
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pagos vencidos
    /// </summary>
    [HttpGet("vencidos")]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetVencidos()
    {
        var dtos = await _sender.Send(new GetPagosMensualesVencidosQuery());
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene pagos pendientes
    /// </summary>
    [HttpGet("pendientes")]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetPendientes()
    {
        var dtos = await _sender.Send(new GetPagosMensualesPendientesQuery());
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene titulares con cuota pendiente del mes actual listos para notificar por WhatsApp.
    /// Incluye nombre completo, teléfono principal, saldo pendiente y período.
    /// </summary>
    [HttpGet("pendientes-para-notificar")]
    public async Task<ActionResult<List<PagoMensualModel.NotificarItem>>> GetPendientesParaNotificar(
        CancellationToken cancellationToken)
    {
        var items = await _sender.Send(new GetPagosPendientesParaNotificarQuery(), cancellationToken);
        return Ok(items);
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
        var resultado = await _sender.Send(new GetPagosMensualesPaginadosQuery(mes, anio, search, pageNumber, pageSize));
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
        var estadisticas = await _sender.Send(new GetEstadisticasPagosMesQuery(mes, anio));
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

        var resultado = await _sender.Send(new GetTitularesConPagosQuery(search, pageNumber, pageSize));
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

        var resultado = await _sender.Send(new GetPagoMovimientosQuery(
            fechaDesde,
            fechaHasta,
            titularId,
            medioPago,
            pageNumber,
            pageSize));
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene pagos por titular
    /// </summary>
    [HttpGet("titular/{titularId}")]
    public async Task<ActionResult<List<PagoMensualModel.Response>>> GetByTitular(int titularId)
    {
        var dtos = await _sender.Send(new GetPagosMensualesPorTitularQuery(titularId));
        return Ok(dtos);
    }

    /// <summary>
    /// Obtiene un pago mensual por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PagoMensualModel.Response>> GetById(int id)
    {
        var dto = await _sender.Send(new GetPagoMensualByIdQuery(id));
        
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
        var resultado = await _sender.Send(new CreatePagoMensualCommand(dto));

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
        await _sender.Send(new RegistrarPagoCommand(id, dto));

        _logger.LogInformation("Pago registrado en pago mensual (ID: {Id}), Monto: {Monto}", id, dto.Monto);

        return NoContent();
    }

    /// <summary>
    /// Genera o reutiliza un link de Mercado Pago para una cuota
    /// </summary>
    [HttpPost("{id}/mercadopago-link")]
    public async Task<ActionResult> GenerarMercadoPagoLink(int id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GenerarLinkMercadoPagoCommand(id), cancellationToken);

        _logger.LogInformation("Link Mercado Pago listo para pago mensual (ID: {Id})", id);

        return Ok(new { url = result.Url });
    }

    /// <summary>
    /// Elimina un movimiento previamente registrado en un pago mensual
    /// </summary>
    [HttpDelete("{pagoMensualId}/movimientos/{movimientoId}")]
    public async Task<ActionResult> EliminarMovimiento(int pagoMensualId, int movimientoId)
    {
        var movimiento = await _sender.Send(new EliminarPagoMovimientoCommand(pagoMensualId, movimientoId));

        _logger.LogInformation(
            "Movimiento eliminado (MovimientoId: {MovimientoId}) del pago mensual {PagoMensualId} - Titular {TitularId} ({TitularNombreCompleto}). Monto reversado: {Monto}",
            movimiento.Id,
            movimiento.PagoMensualId,
            movimiento.TitularId,
            movimiento.TitularNombreCompleto,
            movimiento.Monto);

        return NoContent();
    }

    /// <summary>
    /// Actualiza observaciones de un pago mensual
    /// </summary>
    [HttpPut("{id}/observaciones")]
    public async Task<ActionResult> ActualizarObservaciones(int id, [FromBody] PagoMensualModel.UpdateObservacionesRequest dto)
    {
        await _sender.Send(new ActualizarPagoMensualObservacionesCommand(id, dto));

        _logger.LogInformation("Observaciones actualizadas en pago mensual (ID: {Id})", id);

        return NoContent();
    }

    /// <summary>
    /// Ajusta el monto mensual pactado de un titular y reprocesa sus cuotas
    /// </summary>
    [HttpPut("titulares/{titularId}/ajustar-monto")]
    public async Task<ActionResult<PagoMensualModel.AjusteTitularResponse>> AjustarMontoTitular(
        int titularId,
        [FromBody] PagoMensualModel.AjusteTitularRequest dto)
    {
        var response = await _sender.Send(new AjustarMontoTitularCommand(titularId, dto));

        _logger.LogInformation(
            "Monto mensual ajustado para titular {TitularId}. ${MontoAnterior} -> ${MontoNuevo}. Cuotas afectadas: {Cantidad}",
            response.TitularId,
            response.MontoAnterior,
            response.MontoNuevo,
            response.CantidadCuotasActualizadas);

        return Ok(response);
    }
}
