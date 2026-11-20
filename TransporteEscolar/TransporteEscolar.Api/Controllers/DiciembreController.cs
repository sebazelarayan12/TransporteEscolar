using MediatR;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.Diciembre.Commands;
using TransporteEscolar.Application.Diciembre.DTOs;
using TransporteEscolar.Application.Diciembre.Queries;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Confirmación de diciembre por titular: si va y el monto de su cuota. Sin [Authorize] propio: la FallbackPolicy
/// JWT exige una persona logueada, igual que en ReinscripcionesController.
/// </summary>
[ApiController]
[Route("api/diciembre")]
public class DiciembreController : ControllerBase
{
    private readonly ISender _sender;

    public DiciembreController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Lista los titulares activos con su decisión de diciembre. Sin anio, usa el año en curso.
    /// Códigos: 200, 400 (año fuera de 2000-2100), 401.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(DiciembreModel.Response), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DiciembreModel.Response>> Get([FromQuery] int? anio, CancellationToken cancellationToken)
    {
        return Ok(await _sender.Send(new GetDiciembreQuery(anio), cancellationToken));
    }

    /// <summary>
    /// Registra si el titular va en diciembre (va=true exige monto; va=false elimina la cuota si no tiene pagos).
    /// Idempotente. Códigos: 200, 400 (validación o regla de negocio), 401, 404 (titular inexistente).
    /// </summary>
    [HttpPut("titulares/{titularId:int}")]
    [ProducesResponseType(typeof(DiciembreModel.TitularItem), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DiciembreModel.TitularItem>> Confirmar(
        int titularId,
        [FromBody] DiciembreModel.Request? request,
        CancellationToken cancellationToken)
    {
        var payload = request ?? new DiciembreModel.Request(0, null, null);
        var resultado = await _sender.Send(
            new ConfirmarDiciembreCommand(titularId, payload.Anio, payload.Va, payload.Monto),
            cancellationToken);

        return Ok(resultado);
    }
}
