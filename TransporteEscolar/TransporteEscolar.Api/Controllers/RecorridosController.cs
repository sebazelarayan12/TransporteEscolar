using MediatR;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Recorridos.Queries;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecorridosController : ControllerBase
{
    private readonly IRecorridoService _recorridoService;
    private readonly IRecorridoMarginalService _recorridoMarginalService;
    private readonly ISender _sender;
    private readonly ILogger<RecorridosController> _logger;

    public RecorridosController(
        IRecorridoService recorridoService,
        IRecorridoMarginalService recorridoMarginalService,
        ISender sender,
        ILogger<RecorridosController> logger)
    {
        _recorridoService = recorridoService;
        _recorridoMarginalService = recorridoMarginalService;
        _sender = sender;
        _logger = logger;
    }

    /// <summary>Colegios activos con sus coordenadas, para dibujarlos en el mapa.</summary>
    [HttpGet("colegios")]
    public async Task<ActionResult<List<ColegioModel.Response>>> GetColegios(CancellationToken cancellationToken)
    {
        var colegios = await _recorridoService.ObtenerColegiosAsync(cancellationToken);
        return Ok(colegios);
    }

    /// <summary>
    /// Recalcula los recorridos de todos los titulares con ubicación cargada.
    /// Es una acción manual y puede tardar: con el motor público hay una pausa
    /// de más de un segundo entre consultas.
    /// </summary>
    [HttpPost("recalcular")]
    public async Task<ActionResult<RecorridoModel.RecalculoResponse>> Recalcular(CancellationToken cancellationToken)
    {
        var resultado = await _recorridoService.RecalcularTodosAsync(cancellationToken);

        _logger.LogInformation(
            "Recálculo manual: {Calculados} calculados, {Omitidos} vigentes, {Fallidos} fallidos",
            resultado.Calculados,
            resultado.Omitidos,
            resultado.Fallidos);

        return Ok(resultado);
    }

    /// <summary>
    /// Recalcula el aporte marginal de cada titular en cada viaje.
    /// Es lento: hace muchas consultas al motor de ruteo.
    /// </summary>
    [HttpPost("recalcular-marginal")]
    public async Task<ActionResult<RecorridoModel.RecalculoMarginalResponse>> RecalcularMarginal(
        CancellationToken cancellationToken)
    {
        var resultado = await _recorridoMarginalService.RecalcularAsync(cancellationToken);

        _logger.LogInformation(
            "Recálculo marginal manual: {Procesados} viajes, {Consultas} consultas, {Fallidos} fallidos",
            resultado.HorariosProcesados,
            resultado.ConsultasRealizadas,
            resultado.Fallidos);

        return Ok(resultado);
    }

    /// <summary>Análisis de kilómetros y precio por kilómetro de todos los titulares activos.</summary>
    [HttpGet("analisis")]
    public async Task<ActionResult<RecorridoModel.AnalisisResponse>> GetAnalisis(CancellationToken cancellationToken)
    {
        var analisis = await _sender.Send(new GetAnalisisKilometrosQuery(), cancellationToken);
        return Ok(analisis);
    }
}
