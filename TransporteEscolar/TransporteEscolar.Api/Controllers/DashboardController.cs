using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    /// <summary>
    /// Obtiene el resumen general para el dashboard web.
    /// </summary>
    [HttpGet("resumen")]
    public async Task<ActionResult<DashboardModel.Response>> GetResumen(
        [FromQuery] int mesesHistorico = 6,
        [FromQuery] int limiteActividad = 6,
        CancellationToken cancellationToken = default)
    {
        var respuesta = await _dashboardService.ObtenerResumenAsync(mesesHistorico, limiteActividad, cancellationToken);
        return Ok(respuesta);
    }
}
