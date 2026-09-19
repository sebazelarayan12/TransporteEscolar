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
    private readonly IRecorridoRepartoService _recorridoRepartoService;
    private readonly ISender _sender;
    private readonly ILogger<RecorridosController> _logger;

    public RecorridosController(
        IRecorridoService recorridoService,
        IRecorridoRepartoService recorridoRepartoService,
        ISender sender,
        ILogger<RecorridosController> logger)
    {
        _recorridoService = recorridoService;
        _recorridoRepartoService = recorridoRepartoService;
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
    public async Task<ActionResult<RecorridoModel.RecalculoResponse>> Recalcular()
    {
        // Operación administrativa manual: cada recorrido ya se persiste por separado, así que
        // cancelarla a mitad de camino solo deja resultados parciales. Por eso NO se usa el token
        // del request: si el cliente corta la conexión, el trabajo termina igual y el resultado se
        // ve refrescando el análisis.
        var resultado = await _recorridoService.RecalcularTodosAsync(CancellationToken.None);

        _logger.LogInformation(
            "Recálculo manual: {Calculados} calculados, {Omitidos} vigentes, {Fallidos} fallidos",
            resultado.Calculados,
            resultado.Omitidos,
            resultado.Fallidos);

        return Ok(resultado);
    }

    /// <summary>
    /// Recalcula el reparto de kilómetros de cada titular en cada viaje (valor de Shapley).
    /// Es lento: hace una consulta al motor de ruteo por viaje.
    /// </summary>
    [HttpPost("recalcular-reparto")]
    public async Task<ActionResult<RecorridoModel.RecalculoRepartoResponse>> RecalcularReparto()
    {
        // Misma razón que en Recalcular: es una operación administrativa manual y cortarla a la
        // mitad deja resultados parciales. Si el cliente se desconecta, el cálculo termina igual y
        // el resultado se ve refrescando el análisis.
        var resultado = await _recorridoRepartoService.RecalcularAsync(CancellationToken.None);

        _logger.LogInformation(
            "Recálculo de reparto manual: {Procesados} viajes, {Consultas} consultas, {Fallidos} fallidos, {Aproximados} aproximados",
            resultado.ViajesProcesados,
            resultado.ConsultasRealizadas,
            resultado.Fallidos,
            resultado.ViajesAproximados);

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
