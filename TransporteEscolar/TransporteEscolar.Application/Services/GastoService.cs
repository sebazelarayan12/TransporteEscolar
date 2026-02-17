using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class GastoService : IGastoService
{
    private readonly IGastoRepository _gastoRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public GastoService(
        IGastoRepository gastoRepository,
        IPagoMensualRepository pagoMensualRepository)
    {
        _gastoRepository = gastoRepository;
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<GastoModel.ResumenMensualResponse> ObtenerResumenMensualAsync(int mes, int anio, CancellationToken cancellationToken = default)
    {
        GastoValidator.ValidateMesAnio(mes, anio);

        var primerDiaMes = CrearPrimerDiaMes(mes, anio);
        var gastos = await _gastoRepository.ObtenerGastosPorMesAsync(mes, anio, cancellationToken);
        var templatesActivos = await _gastoRepository.ObtenerTemplatesActivosHastaMesAsync(primerDiaMes, cancellationToken);

        var gastosPorTemplate = gastos
            .Where(g => g.GastoFijoTemplateId.HasValue)
            .GroupBy(g => g.GastoFijoTemplateId!.Value)
            .ToDictionary(group => group.Key, group => group.First());

        foreach (var template in templatesActivos)
        {
            if (!template.EstaActivo || template.FechaInicio > primerDiaMes)
                continue;

            if (gastosPorTemplate.ContainsKey(template.Id))
                continue;

            var existe = await _gastoRepository.ExisteGastoMensualParaTemplateAsync(template.Id, mes, anio, cancellationToken);
            if (existe)
                continue;

            var gastoGenerado = template.CrearInstanciaMensual(mes, anio);
            await _gastoRepository.AgregarGastoMensualAsync(gastoGenerado, cancellationToken);
            gastos.Add(gastoGenerado);
            gastosPorTemplate[template.Id] = gastoGenerado;
        }

        var gastosFijos = gastos
            .Where(g => g.Tipo == GastoMensual.TipoFijo)
            .OrderBy(g => g.Fecha)
            .ThenBy(g => g.Id)
            .Select(MapearGasto)
            .ToList();

        var gastosVariables = gastos
            .Where(g => g.Tipo == GastoMensual.TipoVariable)
            .OrderBy(g => g.Fecha)
            .ThenBy(g => g.Id)
            .Select(MapearGasto)
            .ToList();

        var totalFijos = gastosFijos.Sum(g => g.Monto);
        var totalVariables = gastosVariables.Sum(g => g.Monto);

        var pagosMensuales = await _pagoMensualRepository.GetByMesAnioAsync(mes, anio, cancellationToken);
        var totalCuotas = pagosMensuales.Sum(p => p.MontoGenerado);
        var gananciaNeta = totalCuotas - (totalFijos + totalVariables);

        var resumen = new GastoModel.ResumenMes(
            totalCuotas,
            totalFijos,
            totalVariables,
            gananciaNeta);

        return new GastoModel.ResumenMensualResponse(resumen, gastosFijos, gastosVariables);
    }

    public async Task<GastoModel.GastoMensualResponse> RegistrarGastoFijoAsync(
        GastoModel.GastoFijoRequest dto,
        CancellationToken cancellationToken = default)
    {
        GastoValidator.ValidateGastoFijo(dto);

        var fechaInicio = CrearPrimerDiaMes(dto.Mes, dto.Anio);
        var template = new GastoFijoTemplate(
            dto.Categoria.Trim(),
            dto.Descripcion.Trim(),
            dto.Monto,
            dto.DiaDeAplicacion,
            dto.MedioPago.Trim(),
            fechaInicio);

        var templateCreado = await _gastoRepository.AgregarTemplateAsync(template, cancellationToken);
        var gastoGenerado = templateCreado.CrearInstanciaMensual(dto.Mes, dto.Anio, observaciones: dto.Observaciones);
        var gastoCreado = await _gastoRepository.AgregarGastoMensualAsync(gastoGenerado, cancellationToken);

        return MapearGasto(gastoCreado);
    }

    public async Task<GastoModel.GastoMensualResponse> RegistrarGastoVariableAsync(
        GastoModel.GastoVariableRequest dto,
        CancellationToken cancellationToken = default)
    {
        GastoValidator.ValidateGastoVariable(dto);

        var fecha = DateTime.SpecifyKind(dto.Fecha.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var gasto = new GastoMensual(
            dto.Mes,
            dto.Anio,
            GastoMensual.TipoVariable,
            dto.Categoria.Trim(),
            dto.Descripcion.Trim(),
            dto.Monto,
            fecha,
            dto.MedioPago.Trim(),
            dto.EstadoPago.Trim(),
            dto.Observaciones);

        var gastoCreado = await _gastoRepository.AgregarGastoMensualAsync(gasto, cancellationToken);
        return MapearGasto(gastoCreado);
    }

    private static DateTime CrearPrimerDiaMes(int mes, int anio)
    {
        return new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private static GastoModel.GastoMensualResponse MapearGasto(GastoMensual gasto)
    {
        return new GastoModel.GastoMensualResponse(
            gasto.Id,
            gasto.Mes,
            gasto.Anio,
            gasto.Tipo,
            gasto.Categoria,
            gasto.Descripcion,
            gasto.Monto,
            gasto.Fecha,
            gasto.MedioPago,
            gasto.EstadoPago,
            gasto.Observaciones,
            gasto.GastoFijoTemplateId);
    }
}
