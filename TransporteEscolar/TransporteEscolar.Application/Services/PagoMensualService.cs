using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class PagoMensualService : IPagoMensualService
{
    private readonly IPagoMensualRepository _repository;
    private readonly ITitularRepository _titularRepository;

    public PagoMensualService(
        IPagoMensualRepository repository,
        ITitularRepository titularRepository)
    {
        _repository = repository;
        _titularRepository = titularRepository;
    }

    public async Task<PagoMensualModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var pagoMensual = await _repository.GetByIdAsync(id, cancellationToken);
        return pagoMensual != null ? MapearAResponse(pagoMensual) : null;
    }

    public async Task<List<PagoMensualModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var pagos = await _repository.GetAllAsync(cancellationToken);
        return pagos.Select(MapearAResponse).ToList();
    }

    public async Task<List<PagoMensualModel.Response>> ObtenerPorTitularAsync(int titularId, CancellationToken cancellationToken = default)
    {
        var pagos = await _repository.GetByTitularIdAsync(titularId, cancellationToken);
        return pagos.Select(MapearAResponse).ToList();
    }

    public async Task<List<PagoMensualModel.Response>> ObtenerVencidosAsync(CancellationToken cancellationToken = default)
    {
        var pagos = await _repository.GetVencidosAsync(cancellationToken);
        return pagos.Select(MapearAResponse).ToList();
    }

    public async Task<List<PagoMensualModel.Response>> ObtenerPendientesAsync(CancellationToken cancellationToken = default)
    {
        var pagos = await _repository.GetPendientesAsync(cancellationToken);
        return pagos.Select(MapearAResponse).ToList();
    }

    public async Task<PaginationModel.ResponsePagination<PagoMensualModel.Response>> ObtenerPaginadosAsync(
        PagoMensualModel.FilterRequest request, 
        CancellationToken cancellationToken = default)
    {
        // Get all payments for the month/year
        var pagos = await _repository.GetByMesAnioAsync(request.Mes, request.Anio, cancellationToken);
        
        // Filter by search term (titular apellido)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerm = request.Search.Trim();
            pagos = pagos
                .Where(p =>
                {
                    var titular = p.Titular;
                    if (titular is null)
                        return false;

                    return (titular.Apellido?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false)
                        || (titular.NombreContacto?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false)
                        || (titular.Direccion?.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ?? false);
                })
                .ToList();
        }
        
        var totalCount = pagos.Count;
        
        // Apply pagination
        var pagosPaginados = pagos
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();
        
        var response = pagosPaginados.Select(MapearAResponse).ToList();
        
        return new PaginationModel.ResponsePagination<PagoMensualModel.Response>(response, totalCount);
    }

    public async Task<PaginationModel.ResponsePagination<TitularModel.Response>> ObtenerTitularesConPagosAsync(
        PaginationModel.FilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (titulares, totalCount) = await _repository.GetTitularesConPagosAsync(
            request.Search,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var data = titulares
            .Select(TitularMapper.MapearAResponse)
            .ToList();

        return new PaginationModel.ResponsePagination<TitularModel.Response>(data, totalCount);
    }

    public async Task<PaginationModel.ResponsePagination<PagoMovimientoModel.Response>> ObtenerMovimientosAsync(
        PagoMovimientoModel.FilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var hoyUtc = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var hoy = DateOnly.FromDateTime(hoyUtc);
        var fechaDesde = request.FechaDesde ?? hoy.AddDays(-30);
        var fechaHasta = request.FechaHasta ?? hoy;

        if (fechaHasta < fechaDesde)
            throw new ValidationException("fechaHasta debe ser mayor o igual a fechaDesde.");

        if (request.PageNumber <= 0 || request.PageSize <= 0)
            throw new ValidationException("pageNumber y pageSize deben ser mayores a 0.");

        var fechaDesdeUtc = new DateTimeOffset(
            DateTime.SpecifyKind(fechaDesde.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc));
        var fechaHastaUtc = new DateTimeOffset(
            DateTime.SpecifyKind(fechaHasta.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc));
        var fechaHastaExclusive = fechaHastaUtc.AddDays(1);

        var (movimientos, totalCount) = await _repository.ObtenerMovimientosAsync(
            fechaDesdeUtc,
            fechaHastaExclusive,
            request.TitularId,
            request.MedioPago,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var data = movimientos
            .Select(movimiento => MapearMovimiento(movimiento))
            .ToList();

        return new PaginationModel.ResponsePagination<PagoMovimientoModel.Response>(data, totalCount);
    }

    public async Task<PagoMensualModel.EstadisticasMes> ObtenerEstadisticasMesAsync(
        int mes, 
        int anio, 
        CancellationToken cancellationToken = default)
    {
        var pagos = await _repository.GetByMesAnioAsync(mes, anio, cancellationToken);
        
        var totalPagos = pagos.Count;
        var cantidadPagados = pagos.Count(p => p.EstaPagado());
        var cantidadVencidos = pagos.Count(p => p.EstaVencido());
        var cantidadPendientes = totalPagos - cantidadPagados - cantidadVencidos;
        
        var totalRecaudado = pagos.Sum(p => p.TotalPagado());
        var totalPendiente = pagos.Sum(p => p.SaldoPendiente());
        
        return new PagoMensualModel.EstadisticasMes(
            totalPagos,
            cantidadPagados,
            cantidadPendientes,
            cantidadVencidos,
            totalRecaudado,
            totalPendiente);
    }

    public async Task<PagoMensualModel.Response> CrearAsync(PagoMensualModel.Request dto, CancellationToken cancellationToken = default)
    {
        PagoMensualValidator.Validate(dto);

        var titular = await _titularRepository.GetByIdAsync(dto.TitularId, cancellationToken);
        if (titular == null)
            throw new NotFoundException(nameof(Titular), dto.TitularId);

        var existe = await _repository.GetByTitularMesAnioAsync(dto.TitularId, dto.Mes, dto.Anio, cancellationToken);
        if (existe != null)
            throw new ValidationException($"Ya existe un pago mensual para {dto.Mes}/{dto.Anio} del titular {dto.TitularId}");

        var pagoMensual = new PagoMensual(
            dto.TitularId, dto.Mes, dto.Anio, dto.MontoGenerado, dto.Observaciones);

        var pagoCreado = await _repository.AddAsync(pagoMensual, cancellationToken);
        return MapearAResponse(pagoCreado);
    }

    public async Task RegistrarPagoAsync(int pagoMensualId, PagoMensualModel.RegistrarPagoRequest dto, CancellationToken cancellationToken = default)
    {
        PagoMensualValidator.ValidateRegistrarPago(dto);

        // Obtener el pago mensual para identificar el titular
        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pagoMensualId, nameof(PagoMensual), cancellationToken);

        // Obtener TODOS los pagos mensuales del titular con saldo pendiente, ordenados cronológicamente
        var todosPagos = await _repository.GetByTitularIdAsync(pagoMensual.TitularId, cancellationToken);
        var pagosPendientes = todosPagos
            .Where(p => p.SaldoPendiente() > 0)
            .OrderBy(p => p.Anio)
            .ThenBy(p => p.Mes)
            .ToList();

        if (!pagosPendientes.Any())
            throw new ValidationException("No hay pagos pendientes para este titular");

        // Distribuir el monto pagado desde el mes más antiguo hacia adelante
        decimal montoRestante = dto.Monto;
        
        foreach (var pago in pagosPendientes)
        {
            if (montoRestante <= 0)
                break;

            var saldoPendiente = pago.SaldoPendiente();
            var montoAplicar = Math.Min(montoRestante, saldoPendiente);

            var movimiento = new PagoMovimiento(
                pago.Id, 
                montoAplicar, 
                dto.FechaPago, 
                dto.MedioPago, 
                montoAplicar < saldoPendiente 
                    ? $"{dto.Observaciones} (Pago parcial)" 
                    : dto.Observaciones);

            pago.Movimientos.Add(movimiento);
            await _repository.UpdateAsync(pago, cancellationToken);

            montoRestante -= montoAplicar;
        }

        // Si quedó dinero sobrante, informar al usuario
        if (montoRestante > 0)
        {
            throw new ValidationException(
                $"El monto pagado (${dto.Monto}) excede la deuda total pendiente. " +
                $"Se aplicaron ${dto.Monto - montoRestante} y sobran ${montoRestante}");
        }
    }

    public async Task<PagoMovimientoModel.Response> EliminarMovimientoAsync(
        int pagoMensualId,
        int movimientoId,
        CancellationToken cancellationToken = default)
    {
        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync,
            pagoMensualId,
            nameof(PagoMensual),
            cancellationToken);

        var movimiento = pagoMensual.Movimientos.FirstOrDefault(m => m.Id == movimientoId);
        if (movimiento == null)
        {
            var movimientoExistente = await _repository.GetMovimientoByIdAsync(movimientoId, cancellationToken);
            if (movimientoExistente == null)
                throw new NotFoundException(nameof(PagoMovimiento), movimientoId);

            throw new ValidationException("El movimiento no pertenece al pago mensual indicado.");
        }

        if (movimiento.PagoMensualId != pagoMensualId)
            throw new ValidationException("El movimiento no pertenece al pago mensual indicado.");

        var nuevoTotalPagado = pagoMensual.TotalPagado() - movimiento.Monto;
        if (nuevoTotalPagado < 0)
            throw new ValidationException("Eliminar este movimiento generaría un total pagado negativo.");

        var movimientoEliminado = MapearMovimiento(movimiento, pagoMensual);

        pagoMensual.Movimientos.Remove(movimiento);
        await _repository.UpdateAsync(pagoMensual, cancellationToken);

        return movimientoEliminado;
    }

    public async Task ActualizarObservacionesAsync(int id, PagoMensualModel.UpdateObservacionesRequest dto, CancellationToken cancellationToken = default)
    {
        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(PagoMensual), cancellationToken);

        pagoMensual.ActualizarObservaciones(dto.Observaciones);
        await _repository.UpdateAsync(pagoMensual, cancellationToken);
    }

    public async Task<PagoMensualModel.AjusteTitularResponse> AjustarMontoTitularAsync(
        int titularId,
        PagoMensualModel.AjusteTitularRequest request,
        CancellationToken cancellationToken = default)
    {
        PagoMensualValidator.ValidateAjusteTitular(request);

        var titular = await _titularRepository.GetByIdAsync(titularId, cancellationToken);
        if (titular is null)
            throw new NotFoundException(nameof(Titular), titularId);

        var montoAnterior = titular.MontoMensualPactado;

        titular.ActualizarMontoMensual(request.NuevoMonto);
        await _titularRepository.UpdateAsync(titular, cancellationToken);

        var pagos = await _repository.GetByTitularIdAsync(titularId, cancellationToken);
        var pagosAjustar = request.AplicarSoloPendientes
            ? pagos.Where(p => !p.EstaPagado()).ToList()
            : pagos.ToList();

        var periodosActualizados = new List<string>();
        if (!pagosAjustar.Any())
        {
            return new PagoMensualModel.AjusteTitularResponse(
                titularId,
                montoAnterior,
                titular.MontoMensualPactado,
                0,
                periodosActualizados);
        }

        foreach (var pago in pagosAjustar)
        {
            if (request.NuevoMonto < pago.TotalPagado())
            {
                var periodo = $"{pago.Mes:D2}/{pago.Anio}";
                throw new ValidationException($"El nuevo monto no puede ser menor al total pagado del período {periodo}.");
            }
        }

        var motivo = request.Motivo?.Trim();
        var tieneMotivo = !string.IsNullOrWhiteSpace(motivo);

        foreach (var pago in pagosAjustar)
        {
            pago.ActualizarMontoGenerado(request.NuevoMonto);

            if (tieneMotivo)
            {
                var anotacion = $"Ajuste manual ${montoAnterior} -> ${request.NuevoMonto}. Motivo: {motivo}";
                var nuevaObservacion = string.IsNullOrWhiteSpace(pago.Observaciones)
                    ? anotacion
                    : $"{pago.Observaciones} | {anotacion}";
                pago.ActualizarObservaciones(nuevaObservacion);
            }

            await _repository.UpdateAsync(pago, cancellationToken);
            periodosActualizados.Add($"{pago.Mes:D2}/{pago.Anio}");
        }

        return new PagoMensualModel.AjusteTitularResponse(
            titularId,
            montoAnterior,
            titular.MontoMensualPactado,
            periodosActualizados.Count,
            periodosActualizados);
    }

    public async Task GenerarPagosMensualesAutomaticosAsync(int titularId, int anio, CancellationToken cancellationToken = default)
    {
        var titular = await _titularRepository.GetByIdAsync(titularId, cancellationToken);
        if (titular == null)
            throw new NotFoundException(nameof(Titular), titularId);

        var mesActual = DateTime.UtcNow.Month;
        var anioActual = DateTime.UtcNow.Year;

        // Si el año solicitado es el actual, generar desde el mes actual
        // Si el año es futuro, generar desde marzo
        var mesInicio = (anio == anioActual) ? mesActual : 3;
        var mesFin = 11; // Noviembre (diciembre opcional se verá después)

        // Validar que estemos en un rango válido (marzo-noviembre)
        if (anio == anioActual && mesActual > 11)
            return; // Ya pasó el ciclo lectivo

        if (mesInicio < 3)
            mesInicio = 3; // Mínimo marzo

        // Generar pagos mensuales desde mesInicio hasta noviembre
        for (int mes = mesInicio; mes <= mesFin; mes++)
        {
            // Verificar si ya existe un pago para ese mes/año
            var existe = await _repository.GetByTitularMesAnioAsync(titularId, mes, anio, cancellationToken);
            if (existe == null)
            {
                var pagoMensual = new PagoMensual(
                    titularId, 
                    mes, 
                    anio, 
                    titular.MontoMensualPactado, 
                    $"Generado automáticamente al confirmar reinscripciones");

                await _repository.AddAsync(pagoMensual, cancellationToken);
            }
        }
    }

    private static PagoMensualModel.Response MapearAResponse(PagoMensual pagoMensual) =>
        new(pagoMensual.Id,
            pagoMensual.TitularId,
            pagoMensual.Titular?.Apellido ?? string.Empty,
            pagoMensual.Titular?.NombreContacto ?? string.Empty,
            pagoMensual.Titular?.Direccion ?? string.Empty,
            pagoMensual.Mes, pagoMensual.Anio, $"{pagoMensual.Mes:D2}/{pagoMensual.Anio}",
            pagoMensual.MontoGenerado, pagoMensual.TotalPagado(), pagoMensual.SaldoPendiente(),
            pagoMensual.FechaVencimiento, pagoMensual.EstaPagado(), pagoMensual.EstaVencido(),
            pagoMensual.Observaciones,
            pagoMensual.Movimientos.Select(m => new PagoMensualModel.MovimientoResponse(
                m.Id, m.Monto, m.FechaPago, m.MedioPago, m.Observaciones)).ToList());

    private static PagoMovimientoModel.Response MapearMovimiento(
        PagoMovimiento movimiento,
        PagoMensual? pagoMensual = null)
    {
        var pago = pagoMensual ?? movimiento.PagoMensual;
        var titular = pago?.Titular;
        var titularApellido = titular?.Apellido ?? string.Empty;
        var titularNombre = titular?.NombreContacto ?? string.Empty;
        var titularNombreCompleto = string.Join(" ", new[] { titularApellido, titularNombre }
            .Where(value => !string.IsNullOrWhiteSpace(value))).Trim();

        return new PagoMovimientoModel.Response(
            movimiento.Id,
            movimiento.PagoMensualId,
            titular?.Id ?? pago?.TitularId ?? 0,
            titularApellido,
            titularNombre,
            titularNombreCompleto,
            pago?.Mes ?? 0,
            pago?.Anio ?? 0,
            pago is null ? string.Empty : $"{pago.Mes:D2}/{pago.Anio}",
            movimiento.FechaPago,
            movimiento.Monto,
            movimiento.MedioPago,
            movimiento.Observaciones);
    }
}
