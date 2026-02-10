using Microsoft.AspNetCore.Mvc;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Endpoint ligero para verificar el estado general del backend
    /// </summary>
    [HttpGet]
    public ActionResult<HealthStatusResponse> Get()
    {
        _logger.LogTrace("Health check solicitado a las {Timestamp}", System.DateTimeOffset.UtcNow);
        var response = new HealthStatusResponse("Healthy");
        return Ok(response);
    }

    public sealed record HealthStatusResponse(string Status);
}
