using System.Linq;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajerosPaginadosQuery(PaginationModel.FilterRequest Filters)
    : IRequest<PaginationModel.ResponsePagination<PasajeroModel.Response>>;

public sealed class GetPasajerosPaginadosQueryHandler
    : IRequestHandler<GetPasajerosPaginadosQuery, PaginationModel.ResponsePagination<PasajeroModel.Response>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajerosPaginadosQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<PaginationModel.ResponsePagination<PasajeroModel.Response>> Handle(
        GetPasajerosPaginadosQuery request,
        CancellationToken cancellationToken)
    {
        var pasajerosActivos = await _pasajeroRepository.GetActivosAsync(cancellationToken);

        var query = pasajerosActivos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Filters.Search))
        {
            var search = request.Filters.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Nombre.ToLower().Contains(search) ||
                (p.Titular.Apellido != null && p.Titular.Apellido.ToLower().Contains(search)) ||
                p.Colegio.ToLower().Contains(search));
        }

        query = query.OrderBy(p => p.Nombre);

        var total = query.Count();

        var page = query
            .Skip((request.Filters.PageNumber - 1) * request.Filters.PageSize)
            .Take(request.Filters.PageSize)
            .Select(p => p.ToResponse())
            .ToList();

        return new PaginationModel.ResponsePagination<PasajeroModel.Response>(page, total);
    }
}
