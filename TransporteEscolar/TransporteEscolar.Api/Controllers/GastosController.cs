using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastosController : ControllerBase
{
    private readonly IGastoService _gastoService;
    private readonly ILogger<GastosController> _logger;

    public GastosController(
        IGastoService gastoService,
        ILogger<GastosController> logger)
    {
        _gastoService = gastoService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el resumen financiero del mes indicado.
    /// </summary>
    [HttpGet("resumen")]
    public async Task<ActionResult<GastoModel.ResumenMensualResponse>> ObtenerResumenMensual(
        [FromQuery] int mes,
        [FromQuery] int anio)
    {
        var resumen = await _gastoService.ObtenerResumenMensualAsync(mes, anio);
        return Ok(resumen);
    }

    /// <summary>
    /// Registra una plantilla de gasto fijo y genera la instancia del mes actual.
    /// </summary>
    [HttpPost("fijos")]
    public async Task<ActionResult<GastoModel.GastoMensualResponse>> RegistrarGastoFijo(
        [FromBody] GastoModel.GastoFijoRequest dto)
    {
        var gasto = await _gastoService.RegistrarGastoFijoAsync(dto);

        _logger.LogInformation(
            "Gasto fijo registrado TemplateId {TemplateId} para {Mes}/{Anio}",
            gasto.TemplateId,
            gasto.Mes,
            gasto.Anio);

        return CreatedAtAction(
            nameof(ObtenerResumenMensual),
            new { mes = gasto.Mes, anio = gasto.Anio },
            gasto);
    }

    /// <summary>
    /// Registra un gasto variable para el mes seleccionado.
    /// </summary>
    [HttpPost("variables")]
    public async Task<ActionResult<GastoModel.GastoMensualResponse>> RegistrarGastoVariable(
        [FromBody] GastoModel.GastoVariableRequest dto)
    {
        var gasto = await _gastoService.RegistrarGastoVariableAsync(dto);

        _logger.LogInformation(
            "Gasto variable registrado (ID: {Id}) para {Mes}/{Anio}",
            gasto.Id,
            gasto.Mes,
            gasto.Anio);

        return CreatedAtAction(
            nameof(ObtenerResumenMensual),
            new { mes = gasto.Mes, anio = gasto.Anio },
            gasto);
    }
}
