using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class IngresoService : IIngresoService
{
    private readonly IIngresoRepository _ingresoRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly IGastoRepository _gastoRepository;
    private readonly ILogger<IngresoService> _logger;

    public IngresoService(
        IIngresoRepository ingresoRepository,
        IPagoMensualRepository pagoMensualRepository,
        IGastoRepository gastoRepository,
        ILogger<IngresoService> logger)
    {
        _ingresoRepository = ingresoRepository;
        _pagoMensualRepository = pagoMensualRepository;
        _gastoRepository = gastoRepository;
        _logger = logger;
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

    public async Task<IngresoModel.IngresoMensualResponse> ActualizarIngresoFijoAsync(
        int templateId,
        IngresoModel.UpdateIngresoFijoRequest dto,
        CancellationToken cancellationToken = default)
    {
        IngresoValidator.ValidateUpdateIngresoFijo(dto);

        var template = await _ingresoRepository.ObtenerTemplatePorIdAsync(templateId, cancellationToken)
            ?? throw new NotFoundException(nameof(IngresoFijoTemplate), templateId);

        var categoria = dto.Categoria.Trim();
        var descripcion = dto.Descripcion.Trim();
        var medioCobro = dto.MedioCobro.Trim();
        var observaciones = dto.Observaciones?.Trim();

        template.ActualizarDatos(categoria, descripcion, dto.Monto, dto.DiaDeAplicacion, medioCobro, observaciones, dto.EstaActivo);
        await _ingresoRepository.ActualizarTemplateAsync(template, cancellationToken);

        var ingresoMensual = await _ingresoRepository.ObtenerIngresoMensualPorTemplateAsync(templateId, dto.Mes, dto.Anio, cancellationToken);

        if (ingresoMensual is null)
        {
            var nuevaInstancia = template.CrearInstanciaMensual(dto.Mes, dto.Anio, observaciones: observaciones);
            ingresoMensual = await _ingresoRepository.AgregarIngresoMensualAsync(nuevaInstancia, cancellationToken);
        }

        var instanciasFuturas = await _ingresoRepository.GetFuturosPorTemplateAsync(templateId, dto.Mes, dto.Anio, cancellationToken);

        if (instanciasFuturas.Count > 0)
        {
            foreach (var instancia in instanciasFuturas)
            {
                instancia.ActualizarDesdeTemplate(template, observaciones);
            }

            await _ingresoRepository.BulkUpdateAsync(instanciasFuturas, cancellationToken);
            _logger.LogInformation(
                "Actualizados {Cantidad} ingresos mensuales vinculados al template {TemplateId} desde {Mes}/{Anio}.",
                instanciasFuturas.Count,
                templateId,
                dto.Mes,
                dto.Anio);
        }
        else
        {
            _logger.LogInformation(
                "No se encontraron instancias futuras para el template de ingresos {TemplateId} desde {Mes}/{Anio}.",
                templateId,
                dto.Mes,
                dto.Anio);
        }

        var resultado = instanciasFuturas.FirstOrDefault(i => i.Mes == dto.Mes && i.Anio == dto.Anio) ?? ingresoMensual;
        return MapearIngreso(resultado);
    }

    public async Task DesactivarIngresoFijoAsync(int templateId, CancellationToken cancellationToken = default)
    {
        var template = await _ingresoRepository.ObtenerTemplatePorIdAsync(templateId, cancellationToken)
            ?? throw new NotFoundException(nameof(IngresoFijoTemplate), templateId);

        template.Desactivar();
        await _ingresoRepository.ActualizarTemplateAsync(template, cancellationToken);

        var fechaActual = DateTime.UtcNow;
        await _ingresoRepository.EliminarInstanciasFuturasPorTemplateAsync(templateId, fechaActual.Month, fechaActual.Year, cancellationToken);
    }

    public async Task EliminarIngresoVariableAsync(int ingresoId, CancellationToken cancellationToken = default)
    {
        var ingreso = await _ingresoRepository.ObtenerIngresoMensualPorIdAsync(ingresoId, cancellationToken)
            ?? throw new NotFoundException(nameof(IngresoMensual), ingresoId);

        if (ingreso.Tipo != IngresoMensual.TipoVariable)
        {
            throw new ValidationException("Solo se pueden eliminar ingresos variables.");
        }

        await _ingresoRepository.EliminarIngresoMensualAsync(ingreso, cancellationToken);
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
