using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class IngresoService : IIngresoService
{
    private readonly IIngresoRepository _ingresoRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly IGastoRepository _gastoRepository;

    public IngresoService(
        IIngresoRepository ingresoRepository,
        IPagoMensualRepository pagoMensualRepository,
        IGastoRepository gastoRepository)
    {
        _ingresoRepository = ingresoRepository;
        _pagoMensualRepository = pagoMensualRepository;
        _gastoRepository = gastoRepository;
    }

    public async Task<IngresoModel.ResumenMensualResponse> ObtenerResumenMensualAsync(int mes, int anio, CancellationToken cancellationToken = default)
    {
        IngresoValidator.ValidateMesAnio(mes, anio);

        var primerDiaMes = CrearPrimerDiaMes(mes, anio);
        var ingresos = await _ingresoRepository.ObtenerIngresosPorMesAsync(mes, anio, cancellationToken);
        var templatesActivos = await _ingresoRepository.ObtenerTemplatesActivosHastaMesAsync(primerDiaMes, cancellationToken);

        var ingresosPorTemplate = ingresos
            .Where(i => i.IngresoFijoTemplateId.HasValue)
            .GroupBy(i => i.IngresoFijoTemplateId!.Value)
            .ToDictionary(group => group.Key, group => group.First());

        foreach (var template in templatesActivos)
        {
            if (!template.EstaActivo || template.FechaInicio > primerDiaMes)
            {
                continue;
            }

            if (ingresosPorTemplate.ContainsKey(template.Id))
            {
                continue;
            }

            var existe = await _ingresoRepository.ExisteIngresoMensualParaTemplateAsync(template.Id, mes, anio, cancellationToken);
            if (existe)
            {
                continue;
            }

            var ingresoGenerado = template.CrearInstanciaMensual(mes, anio);
            var ingresoPersistido = await _ingresoRepository.AgregarIngresoMensualAsync(ingresoGenerado, cancellationToken);
            ingresos.Add(ingresoPersistido);
            ingresosPorTemplate[template.Id] = ingresoPersistido;
        }

        var ingresosFijos = ingresos
            .Where(i => i.Tipo == IngresoMensual.TipoFijo)
            .OrderBy(i => i.Fecha)
            .ThenBy(i => i.Id)
            .Select(MapearIngreso)
            .ToList();

        var ingresosVariables = ingresos
            .Where(i => i.Tipo == IngresoMensual.TipoVariable)
            .OrderBy(i => i.Fecha)
            .ThenBy(i => i.Id)
            .Select(MapearIngreso)
            .ToList();

        var totalIngresosFijos = ingresosFijos.Sum(i => i.Monto);
        var totalIngresosVariables = ingresosVariables.Sum(i => i.Monto);
        var totalIngresosExternos = totalIngresosFijos + totalIngresosVariables;

        var pagosMensuales = await _pagoMensualRepository.GetByMesAnioAsync(mes, anio, cancellationToken);
        var totalCuotas = pagosMensuales.Sum(p => p.MontoGenerado);

        var gastosMensuales = await _gastoRepository.ObtenerGastosPorMesAsync(mes, anio, cancellationToken);
        var totalGastos = gastosMensuales.Sum(g => g.Monto);

        var gananciaNeta = (totalCuotas + totalIngresosExternos) - totalGastos;

        var totales = new IngresoModel.ResumenTotales(
            totalCuotas,
            totalIngresosFijos,
            totalIngresosVariables,
            totalIngresosExternos,
            totalGastos,
            gananciaNeta);

        return new IngresoModel.ResumenMensualResponse(totales, ingresosFijos, ingresosVariables);
    }

    public async Task<IngresoModel.IngresoMensualResponse> RegistrarIngresoFijoAsync(
        IngresoModel.IngresoFijoRequest dto,
        CancellationToken cancellationToken = default)
    {
        IngresoValidator.ValidateIngresoFijo(dto);

        var observaciones = dto.Observaciones?.Trim();
        var fechaInicio = CrearPrimerDiaMes(dto.Mes, dto.Anio);
        var template = new IngresoFijoTemplate(
            dto.Categoria.Trim(),
            dto.Descripcion.Trim(),
            dto.Monto,
            dto.DiaDeAplicacion,
            dto.MedioCobro.Trim(),
            fechaInicio,
            observaciones);

        var templateCreado = await _ingresoRepository.AgregarTemplateAsync(template, cancellationToken);
        var ingresoGenerado = templateCreado.CrearInstanciaMensual(dto.Mes, dto.Anio, observaciones: observaciones);
        var ingresoCreado = await _ingresoRepository.AgregarIngresoMensualAsync(ingresoGenerado, cancellationToken);

        return MapearIngreso(ingresoCreado);
    }

    public async Task<IngresoModel.IngresoMensualResponse> RegistrarIngresoVariableAsync(
        IngresoModel.IngresoVariableRequest dto,
        CancellationToken cancellationToken = default)
    {
        IngresoValidator.ValidateIngresoVariable(dto);

        var fecha = DateTime.SpecifyKind(dto.Fecha.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var ingreso = new IngresoMensual(
            dto.Mes,
            dto.Anio,
            IngresoMensual.TipoVariable,
            dto.Categoria.Trim(),
            dto.Descripcion.Trim(),
            dto.Monto,
            fecha,
            dto.MedioCobro.Trim(),
            dto.EstadoCobro.Trim(),
            dto.Observaciones?.Trim());

        var ingresoCreado = await _ingresoRepository.AgregarIngresoMensualAsync(ingreso, cancellationToken);
        return MapearIngreso(ingresoCreado);
    }

    private static DateTime CrearPrimerDiaMes(int mes, int anio)
    {
        return new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private static IngresoModel.IngresoMensualResponse MapearIngreso(IngresoMensual ingreso)
    {
        return new IngresoModel.IngresoMensualResponse(
            ingreso.Id,
            ingreso.Mes,
            ingreso.Anio,
            ingreso.Tipo,
            ingreso.Categoria,
            ingreso.Descripcion,
            ingreso.Monto,
            ingreso.Fecha,
            ingreso.MedioCobro,
            ingreso.EstadoCobro,
            ingreso.Observaciones,
            ingreso.IngresoFijoTemplateId);
    }
}
