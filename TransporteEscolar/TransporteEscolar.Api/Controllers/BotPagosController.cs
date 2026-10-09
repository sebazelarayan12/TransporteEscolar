using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.Bot.Queries;
using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Endpoints para que el bot de WhatsApp consulte titulares y cuotas, simule, registre y anule pagos de cuotas.
/// Requiere X-Api-Key con el alcance bot:pagos. Es un controller aparte de BotController y de BotGastosController:
/// un [Authorize] de clase se suma al del método y exigiría también otros alcances.
/// </summary>
[ApiController]
[Route("api/bot/pagos")]
[Authorize(Policy = ApiPolicies.BotPagos)]
public class BotPagosController : ControllerBase
{
    private readonly ISender _sender;

    public BotPagosController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Lista los titulares activos con los nombres de pila de sus pasajeros. Sin dirección, teléfono ni montos.
    /// Códigos: 200, 401 (sin clave o clave inválida), 403 (clave sin el alcance bot:pagos), 503 (no hay claves configuradas).
    /// </summary>
    [HttpGet("titulares")]
    [ProducesResponseType(typeof(List<BotPagoModel.TitularItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<List<BotPagoModel.TitularItem>>> GetTitulares(CancellationToken cancellationToken)
    {
        return Ok(await _sender.Send(new GetTitularesParaPagosBotQuery(), cancellationToken));
    }

    /// <summary>
    /// Lista las cuotas con saldo pendiente de un titular, ordenadas por año y mes.
    /// Códigos: 200, 401, 403, 404 (titular inexistente o dado de baja), 503.
    /// </summary>
    [HttpGet("titulares/{titularId:int}/cuotas")]
    [ProducesResponseType(typeof(BotPagoModel.CuotasResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<BotPagoModel.CuotasResponse>> GetCuotas(int titularId, CancellationToken cancellationToken)
    {
        return Ok(await _sender.Send(new GetCuotasPendientesBotQuery(titularId), cancellationToken));
    }

    /// <summary>
    /// Simula cómo se repartiría un monto entre las cuotas pendientes. No escribe nada.
    /// Códigos: 200, 400 (validación, excedente sobre la deuda o sin cuotas pendientes), 401, 403, 404, 503.
    /// </summary>
    [HttpPost("simular")]
    [ProducesResponseType(typeof(BotPagoModel.SimulacionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<BotPagoModel.SimulacionResponse>> Simular(
        [FromBody] BotPagoModel.SimularRequest? request,
        CancellationToken cancellationToken)
    {
        var payload = request ?? new BotPagoModel.SimularRequest(null, null);
        return Ok(await _sender.Send(new SimularPagoBotCommand(payload), cancellationToken));
    }

    /// <summary>
    /// Registra un pago repartido entre las cuotas pendientes. Idempotente por mensajeId: 201 si se creó, 200 con los
    /// movimientos existentes si ya estaba. Códigos: 201, 200, 400 (validación o monto mayor a la deuda), 401, 403, 404, 503.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(BotPagoModel.PagoResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(BotPagoModel.PagoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<BotPagoModel.PagoResponse>> Registrar(
        [FromBody] BotPagoModel.RegistrarRequest? request,
        CancellationToken cancellationToken)
    {
        var payload = request ?? new BotPagoModel.RegistrarRequest(null, null, null, null, null);
        var resultado = await _sender.Send(new RegistrarPagoBotCommand(payload), cancellationToken);

        return resultado.Creado
            ? StatusCode(StatusCodes.Status201Created, resultado.Pago)
            : Ok(resultado.Pago);
    }

    /// <summary>
    /// Anula un pago cargado por el bot hace menos de 24 horas, borrando todos sus movimientos por grupo.
    /// Códigos: 204, 400 (no es del bot o pasó el plazo), 401, 403, 404 (el grupo no existe), 503.
    /// </summary>
    [HttpDelete("{grupoId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Anular(Guid grupoId, CancellationToken cancellationToken)
    {
        await _sender.Send(new AnularPagoBotCommand(grupoId), cancellationToken);
        return NoContent();
    }
}
