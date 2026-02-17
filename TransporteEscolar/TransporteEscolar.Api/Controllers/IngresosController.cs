using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngresosController : ControllerBase
{
    private readonly IIngresoService _ingresoService;
    private readonly ILogger<IngresosController> _logger;

    public IngresosController(
        IIngresoService ingresoService,
        ILogger<IngresosController> logger)
    {
        _ingresoService = ingresoService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene el resumen completo de ingresos y gastos del mes indicado.
    /// </summary>
    [HttpGet("resumen")]
    public async Task<ActionResult<IngresoModel.ResumenMensualResponse>> ObtenerResumenMensual(
        [FromQuery] int mes,
        [FromQuery] int anio)
    {
        var resumen = await _ingresoService.ObtenerResumenMensualAsync(mes, anio);
        return Ok(resumen);
    }

    /// <summary>
    /// Registra una plantilla de ingreso fijo y la instancia del mes solicitado.
    /// </summary>
    [HttpPost("fijos")]
    public async Task<ActionResult<IngresoModel.IngresoMensualResponse>> RegistrarIngresoFijo(
        [FromBody] IngresoModel.IngresoFijoRequest dto)
    {
        var ingreso = await _ingresoService.RegistrarIngresoFijoAsync(dto);

        _logger.LogInformation(
            "Ingreso fijo registrado TemplateId {TemplateId} para {Mes}/{Anio}",
            ingreso.TemplateId,
            ingreso.Mes,
            ingreso.Anio);

        return CreatedAtAction(
            nameof(ObtenerResumenMensual),
            new { mes = ingreso.Mes, anio = ingreso.Anio },
            ingreso);
    }

    /// <summary>
    /// Registra un ingreso variable dentro del mes seleccionado.
    /// </summary>
    [HttpPost("variables")]
    public async Task<ActionResult<IngresoModel.IngresoMensualResponse>> RegistrarIngresoVariable(
        [FromBody] IngresoModel.IngresoVariableRequest dto)
    {
        var ingreso = await _ingresoService.RegistrarIngresoVariableAsync(dto);

        _logger.LogInformation(
            "Ingreso variable registrado (ID: {Id}) para {Mes}/{Anio}",
            ingreso.Id,
            ingreso.Mes,
            ingreso.Anio);

        return CreatedAtAction(
            nameof(ObtenerResumenMensual),
            new { mes = ingreso.Mes, anio = ingreso.Anio },
            ingreso);
    }

    /// <summary>
    /// Actualiza muna plantilla de ingreso fijo y su instancia del mes filtrado.
    /// </summary>
    [HttpPut("fijos/{templateId:int}")]
    public async Task<ActionResult<IngresoModel.IngresoMensualResponse>> ActualizarIngresoFijo(
        int templateId,
        [FromBody] IngresoModel.UpdateIngresoFijoRequest dto)
    {
        var ingreso = await _ingresoService.ActualizarIngresoFijoAsync(templateId, dto);

        _logger.LogInformation(
            "Ingreso fijo actualizado TemplateId {TemplateId} para {Mes}/{Anio}",
            templateId,
            ingreso.Mes,
            ingreso.Anio);

        return Ok(ingreso);
    }

    /// <summary>
    /// Desactiva una plantilla de ingreso fijo y elimina instancias futuras.
    /// </summary>
    [HttpDelete("fijos/{templateId:int}")]
    public async Task<IActionResult> DesactivarIngresoFijo(int templateId)
    {
        await _ingresoService.DesactivarIngresoFijoAsync(templateId);

        _logger.LogInformation("Ingreso fijo fue desactivado TemplateId {TemplateId}", templateId);
        return NoContent();
    }

    /// <summary>
    /// Elimina un ingreso variable puntual.
    /// </summary>
    [HttpDelete("variables/{id:int}")]
    public async Task<IActionResult> EliminarIngresoVariable(int id)
    {
        await _ingresoService.EliminarIngresoVariableAsync(id);

        _logger.LogInformation("Ingreso variable eliminado (ID: {Id})", id);
        return NoContent();
    }
}
