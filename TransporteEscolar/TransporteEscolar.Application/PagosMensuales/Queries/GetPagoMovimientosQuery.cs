using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagoMovimientosQuery(
    DateOnly? FechaDesde,
    DateOnly? FechaHasta,
    int? TitularId,
    string? MedioPago,
    int PageNumber,
    int PageSize) : IRequest<PaginationModel.ResponsePagination<PagoMovimientoModel.Response>>;

public sealed class GetPagoMovimientosQueryHandler : IRequestHandler<GetPagoMovimientosQuery, PaginationModel.ResponsePagination<PagoMovimientoModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagoMovimientosQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginationModel.ResponsePagination<PagoMovimientoModel.Response>> Handle(
        GetPagoMovimientosQuery request,
        CancellationToken cancellationToken)
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
            .Select(m => m.ToPagoMovimientoResponse())
            .ToList();

        return data.ToResponsePagination(totalCount);
    }
}
