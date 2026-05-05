using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("pagos/resultado")]
public class PagosResultadosController : ControllerBase
{
    private readonly ILogger<PagosResultadosController> _logger;

    public PagosResultadosController(ILogger<PagosResultadosController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<PagoResultadoResponse> Get([FromQuery] string? estado)
    {
        if (string.IsNullOrWhiteSpace(estado))
        {
            return BadRequest(new PagoResultadoResponse("invalid", "estado invalido"));
        }

        var normalizedState = estado.Trim().ToLowerInvariant();

        var response = normalizedState switch
        {
            "success" => new PagoResultadoResponse("success", "Pago aprobado"),
            "pending" => new PagoResultadoResponse("pending", "Pago pendiente, en revision"),
            "failure" => new PagoResultadoResponse("failure", "Pago rechazado o cancelado"),
            _ => null
        };

        if (response is null)
        {
            return BadRequest(new PagoResultadoResponse("invalid", "estado invalido"));
        }

        _logger.LogInformation(
            "Redirect Mercado Pago recibido con estado {Estado} a las {Timestamp}",
            normalizedState,
            DateTimeOffset.UtcNow);

        return Ok(response);
    }

    public sealed record PagoResultadoResponse(string Status, string Message);
}
