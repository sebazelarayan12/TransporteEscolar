using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagosMensualesPaginadosQuery(
    int Mes,
    int Anio,
    string? Search,
    int PageNumber,
    int PageSize,
    string? Estado = null) : IRequest<PaginationModel.ResponsePagination<PagoMensualModel.Response>>;

public sealed class GetPagosMensualesPaginadosQueryHandler : IRequestHandler<GetPagosMensualesPaginadosQuery, PaginationModel.ResponsePagination<PagoMensualModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagosMensualesPaginadosQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginationModel.ResponsePagination<PagoMensualModel.Response>> Handle(
        GetPagosMensualesPaginadosQuery request,
        CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetByMesAnioAsync(request.Mes, request.Anio, cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            pagos = pagos
                .Where(p =>
                {
                    var titular = p.Titular;
                    if (titular == null)
                        return false;

                    return (titular.Apellido?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                        || (titular.NombreContacto?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
                        || (titular.Direccion?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false);
                })
                .ToList();
        }

        // El filtro por estado se aplica en memoria (no en SQL) para reusar EstaPagado()/EstaVencido()
        // del dominio directamente, en vez de reescribirlos como predicados SQL y arriesgar que la
        // regla de negocio diverja entre los dos lugares.
        pagos = request.Estado?.Trim().ToLowerInvariant() switch
        {
            "pagado" => pagos.Where(p => p.EstaPagado()).ToList(),
            "vencido" => pagos.Where(p => p.EstaVencido()).ToList(),
            "pendiente" => pagos.Where(p => !p.EstaPagado() && !p.EstaVencido()).ToList(),
            _ => pagos
        };

        var totalCount = pagos.Count;

        var data = pagos
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => p.ToResponse())
            .ToList();

        return data.ToResponsePagination(totalCount);
    }
}
