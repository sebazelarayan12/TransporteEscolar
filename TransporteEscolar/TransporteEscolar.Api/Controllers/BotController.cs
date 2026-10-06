using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Application.Bot.Queries;
using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Endpoints de solo lectura para el bot externo de inasistencias.
/// Protegidos con <c>X-Api-Key</c> y el alcance <c>bot:identidad</c> únicamente en este controller
/// (no hay autenticación global).
/// </summary>
[ApiController]
[Route("api/bot")]
[Authorize(Policy = ApiPolicies.BotIdentidad)]
public class BotController : ControllerBase
{
    private readonly ISender _sender;

    public BotController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Busca las familias activas asociadas a un teléfono. Solo lectura; requiere el header
    /// <c>X-Api-Key</c>. Devuelve el mínimo de datos: id, apellido y nombre de contacto del titular,
    /// e id y nombre de pila de sus pasajeros activos. Un mismo número puede coincidir con más de un titular.
    /// <para>
    /// Códigos: 200 (siempre que la key sea válida, con <c>coincidencias</c> vacío si nadie coincide, incluso si
    /// el número tiene dígitos pero no es normalizable); 400 (falta <c>numero</c> o no tiene ningún dígito);
    /// 401 (falta el header o la key es incorrecta); 403 (la key es válida pero no tiene el alcance
    /// <c>bot:identidad</c>); 503 (no hay ninguna key configurada en el servidor).
    /// </para>
    /// </summary>
    /// <param name="numero">Teléfono tal como lo manda el bot (por ejemplo, 549 + área + abonado).</param>
    [HttpGet("titular-por-telefono")]
    [ProducesResponseType(typeof(BotModel.Response), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<BotModel.Response>> GetTitularPorTelefono(
        [FromQuery] string? numero,
        CancellationToken cancellationToken)
    {
        var respuesta = await _sender.Send(new GetTitularPorTelefonoQuery(numero), cancellationToken);
        return Ok(respuesta);
    }
}
