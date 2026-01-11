using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
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

        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pagoMensualId, nameof(PagoMensual), cancellationToken);

        var movimiento = new PagoMovimiento(
            pagoMensualId, dto.Monto, dto.FechaPago, dto.MedioPago, dto.Observaciones);

        pagoMensual.Movimientos.Add(movimiento);
        await _repository.UpdateAsync(pagoMensual, cancellationToken);
    }

    public async Task ActualizarObservacionesAsync(int id, PagoMensualModel.UpdateObservacionesRequest dto, CancellationToken cancellationToken = default)
    {
        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(PagoMensual), cancellationToken);

        pagoMensual.ActualizarObservaciones(dto.Observaciones);
        await _repository.UpdateAsync(pagoMensual, cancellationToken);
    }

    private static PagoMensualModel.Response MapearAResponse(PagoMensual pagoMensual) =>
        new(pagoMensual.Id, pagoMensual.TitularId, pagoMensual.Titular?.Apellido ?? "",
            pagoMensual.Mes, pagoMensual.Anio, $"{pagoMensual.Mes:D2}/{pagoMensual.Anio}",
            pagoMensual.MontoGenerado, pagoMensual.TotalPagado(), pagoMensual.SaldoPendiente(),
            pagoMensual.FechaVencimiento, pagoMensual.EstaPagado(), pagoMensual.EstaVencido(),
            pagoMensual.Observaciones,
            pagoMensual.Movimientos.Select(m => new PagoMensualModel.MovimientoResponse(
                m.Id, m.Monto, m.FechaPago, m.MedioPago, m.Observaciones)).ToList());
}
