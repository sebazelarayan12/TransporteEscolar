using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Application.Services;

public class GastoService : IGastoService
{
    private readonly IGastoRepository _gastoRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly ILogger<GastoService> _logger;

    public GastoService(
        IGastoRepository gastoRepository,
        IPagoMensualRepository pagoMensualRepository,
        ILogger<GastoService> logger)
    {
        _gastoRepository = gastoRepository;
        _pagoMensualRepository = pagoMensualRepository;
        _logger = logger;
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
            if (!template.PuedeGenerarEnMes(mes, anio))
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
        var observaciones = dto.Observaciones?.Trim();
        var (esPlanCuotas, fechaPrimeraCuota, cantidadCuotas) = MapearPlanCuotas(dto.PlanCuotas);
        if (esPlanCuotas && fechaPrimeraCuota is not null)
        {
            fechaInicio = new DateTime(fechaPrimeraCuota.Value.Year, fechaPrimeraCuota.Value.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        }

        var template = new GastoFijoTemplate(
            dto.Categoria.Trim(),
            dto.Descripcion.Trim(),
            dto.Monto,
            dto.DiaDeAplicacion,
            dto.MedioPago.Trim(),
            fechaInicio,
            estaActivo: true,
            esPlanCuotas,
            fechaPrimeraCuota,
            cantidadCuotas);

        var templateCreado = await _gastoRepository.AgregarTemplateAsync(template, cancellationToken);

        var mesGeneracion = esPlanCuotas && fechaPrimeraCuota.HasValue ? fechaPrimeraCuota.Value.Month : dto.Mes;
        var anioGeneracion = esPlanCuotas && fechaPrimeraCuota.HasValue ? fechaPrimeraCuota.Value.Year : dto.Anio;

        if (!templateCreado.PuedeGenerarEnMes(mesGeneracion, anioGeneracion))
        {
            throw new ValidationException("La fecha de la primera cuota debe ser igual o posterior al mes seleccionado.");
        }

        var gastoGenerado = templateCreado.CrearInstanciaMensual(mesGeneracion, anioGeneracion, observaciones: observaciones);
        var gastoCreado = await _gastoRepository.AgregarGastoMensualAsync(gastoGenerado, cancellationToken);

        return MapearGasto(gastoCreado);
    }

    public async Task<GastoModel.GastoMensualResponse> RegistrarGastoVariableAsync(
        GastoModel.GastoVariableRequest dto,
        CancellationToken cancellationToken = default)
    {
        GastoValidator.ValidateGastoVariable(dto);

        var fecha = DateTime.SpecifyKind(dto.Fecha.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var observaciones = dto.Observaciones?.Trim();
        var estadoPago = MapearEstadoPago(dto.EstadoPago);
        var vehiculo = dto.Vehiculo?.Trim();
        var gasto = new GastoMensual(
            dto.Mes,
            dto.Anio,
            GastoMensual.TipoVariable,
            dto.Categoria.Trim(),
            dto.Descripcion.Trim(),
            dto.Monto,
            fecha,
            dto.MedioPago.Trim(),
            estadoPago,
            observaciones,
            vehiculo: vehiculo);

        var gastoCreado = await _gastoRepository.AgregarGastoMensualAsync(gasto, cancellationToken);
        return MapearGasto(gastoCreado);
    }

    public async Task<GastoModel.GastoMensualResponse> ActualizarGastoFijoAsync(
        int templateId,
        GastoModel.UpdateGastoFijoRequest dto,
        CancellationToken cancellationToken = default)
    {
        GastoValidator.ValidateUpdateGastoFijo(dto);

        var template = await _gastoRepository.ObtenerTemplatePorIdAsync(templateId, cancellationToken)
            ?? throw new NotFoundException(nameof(GastoFijoTemplate), templateId);

        var categoria = dto.Categoria.Trim();
        var descripcion = dto.Descripcion.Trim();
        var medioPago = dto.MedioPago.Trim();
        var observaciones = dto.Observaciones?.Trim();
        var (esPlanCuotas, fechaPrimeraCuota, cantidadCuotas) = MapearPlanCuotas(dto.PlanCuotas);

        template.ActualizarDatos(
            categoria,
            descripcion,
            dto.Monto,
            dto.DiaDeAplicacion,
            medioPago,
            dto.EstaActivo,
            esPlanCuotas,
            fechaPrimeraCuota,
            cantidadCuotas);
        await _gastoRepository.ActualizarTemplateAsync(template, cancellationToken);

        var gastoMensual = await _gastoRepository.ObtenerGastoMensualPorTemplateAsync(templateId, dto.Mes, dto.Anio, cancellationToken);

        if (gastoMensual is null)
        {
            if (!template.PuedeGenerarEnMes(dto.Mes, dto.Anio))
            {
                throw new ValidationException("El template no aplica en el mes seleccionado.");
            }

            var nuevaInstancia = template.CrearInstanciaMensual(dto.Mes, dto.Anio, observaciones: observaciones);
            gastoMensual = await _gastoRepository.AgregarGastoMensualAsync(nuevaInstancia, cancellationToken);
        }

        var instanciasFuturas = await _gastoRepository.GetFuturosPorTemplateAsync(templateId, dto.Mes, dto.Anio, cancellationToken);

        if (instanciasFuturas.Count > 0)
        {
            foreach (var instancia in instanciasFuturas)
            {
                instancia.ActualizarDesdeTemplate(template, observaciones);
            }

            await _gastoRepository.BulkUpdateAsync(instanciasFuturas, cancellationToken);
            _logger.LogInformation(
                "Actualizados {Cantidad} gastos mensuales vinculados al template {TemplateId} desde {Mes}/{Anio}.",
                instanciasFuturas.Count,
                templateId,
                dto.Mes,
                dto.Anio);
        }
        else
        {
            _logger.LogInformation(
                "No se encontraron instancias futuras para el template {TemplateId} desde {Mes}/{Anio}.",
                templateId,
                dto.Mes,
                dto.Anio);
        }

        var resultado = instanciasFuturas.FirstOrDefault(g => g.Mes == dto.Mes && g.Anio == dto.Anio) ?? gastoMensual;
        return MapearGasto(resultado);
    }

    public async Task DesactivarGastoFijoAsync(int templateId, CancellationToken cancellationToken = default)
    {
        var template = await _gastoRepository.ObtenerTemplatePorIdAsync(templateId, cancellationToken)
            ?? throw new NotFoundException(nameof(GastoFijoTemplate), templateId);

        template.Desactivar();
        await _gastoRepository.ActualizarTemplateAsync(template, cancellationToken);

        var fechaActual = DateTime.UtcNow;
        await _gastoRepository.EliminarInstanciasFuturasPorTemplateAsync(templateId, fechaActual.Month, fechaActual.Year, cancellationToken);
    }

    public async Task EliminarGastoVariableAsync(int gastoId, CancellationToken cancellationToken = default)
    {
        var gasto = await _gastoRepository.ObtenerGastoMensualPorIdAsync(gastoId, cancellationToken)
            ?? throw new NotFoundException(nameof(GastoMensual), gastoId);

        if (gasto.Tipo != GastoMensual.TipoVariable)
            throw new ValidationException("Solo se pueden eliminar gastos variables.");

        await _gastoRepository.EliminarGastoMensualAsync(gasto, cancellationToken);
    }

    public async Task<GastoModel.GastoMensualResponse> MarcarGastoVariablePagadoAsync(int gastoId, CancellationToken cancellationToken = default)
    {
        var gasto = await _gastoRepository.ObtenerGastoMensualPorIdAsync(gastoId, cancellationToken)
            ?? throw new NotFoundException(nameof(GastoMensual), gastoId);

        if (gasto.Tipo != GastoMensual.TipoVariable)
            throw new ValidationException("Solo se pueden marcar como pagados los gastos variables.");

        gasto.MarcarComoPagado(DateTime.UtcNow);
        await _gastoRepository.ActualizarGastoMensualAsync(gasto, cancellationToken);

        _logger.LogInformation("Gasto variable {GastoId} marcado como pagado", gastoId);

        return MapearGasto(gasto);
    }

    private static DateTime CrearPrimerDiaMes(int mes, int anio)
    {
        return new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private static (bool esPlanCuotas, DateTime? fechaPrimeraCuota, int? cantidadCuotas) MapearPlanCuotas(GastoModel.PlanCuotasRequest? plan)
    {
        if (plan is null)
        {
            return (false, null, null);
        }

        var fecha = DateTime.SpecifyKind(plan.FechaPrimeraCuota.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        return (true, fecha, plan.CantidadCuotas);
    }

    private static EstadoPagoGasto MapearEstadoPago(string estadoPago)
    {
        if (string.IsNullOrWhiteSpace(estadoPago))
        {
            throw new ValidationException("estadoPago es requerido.");
        }

        var valorNormalizado = estadoPago.Trim();
        var estadoValido = Enum.GetNames<EstadoPagoGasto>().FirstOrDefault(nombre =>
            string.Equals(nombre, valorNormalizado, StringComparison.OrdinalIgnoreCase));

        if (estadoValido is null)
        {
            throw new ValidationException("estadoPago debe ser Pendiente o Pagado.");
        }

        return Enum.Parse<EstadoPagoGasto>(estadoValido);
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
            gasto.EstadoPago.ToString(),
            gasto.Observaciones,
            gasto.Vehiculo,
            gasto.GastoFijoTemplateId,
            gasto.NumeroCuota,
            gasto.TotalCuotas,
            gasto.FechaActualizacion);
    }
}
