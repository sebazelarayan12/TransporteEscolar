using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Endpoints para que el bot de WhatsApp anote y anule gastos variables. Requiere X-Api-Key con el alcance
/// bot:gastos. Es un controller aparte de BotController: un [Authorize] de clase se suma al del método y exigiría
/// también bot:identidad.
/// </summary>
[ApiController]
[Route("api/bot/gastos")]
[Authorize(Policy = ApiPolicies.BotGastos)]
public class BotGastosController : ControllerBase
{
    private readonly ISender _sender;

    public BotGastosController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Anota un gasto. Idempotente por mensajeId: 201 si se creó, 200 con el gasto existente si ya estaba.
    /// Códigos: 201, 200, 400 (validación), 401 (sin clave o clave inválida), 403 (clave sin el alcance bot:gastos),
    /// 503 (no hay claves configuradas).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(GastoModel.GastoMensualResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(GastoModel.GastoMensualResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<GastoModel.GastoMensualResponse>> Registrar(
        [FromBody] BotGastoModel.RegistrarRequest? request,
        CancellationToken cancellationToken)
    {
        var payload = request ?? new BotGastoModel.RegistrarRequest(null, null, null, null, null, null, null, null);
        var resultado = await _sender.Send(new RegistrarGastoBotCommand(payload), cancellationToken);

        return resultado.Creado
            ? StatusCode(StatusCodes.Status201Created, resultado.Gasto)
            : Ok(resultado.Gasto);
    }

    /// <summary>
    /// Anula un gasto cargado por el bot hace menos de 24 horas. Códigos: 204, 400 (no es del bot, no es variable o
    /// pasó el plazo), 401, 403, 404 (no existe), 503.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Anular(int id, CancellationToken cancellationToken)
    {
        await _sender.Send(new AnularGastoBotCommand(id), cancellationToken);
        return NoContent();
    }
}
