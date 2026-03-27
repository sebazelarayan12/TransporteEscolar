using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetTitularesConPagosQuery(
    string? Search,
    int PageNumber,
    int PageSize) : IRequest<PaginationModel.ResponsePagination<TitularModel.Response>>;

public sealed class GetTitularesConPagosQueryHandler : IRequestHandler<GetTitularesConPagosQuery, PaginationModel.ResponsePagination<TitularModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetTitularesConPagosQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginationModel.ResponsePagination<TitularModel.Response>> Handle(
        GetTitularesConPagosQuery request,
        CancellationToken cancellationToken)
    {
        var (titulares, totalCount) = await _repository.GetTitularesConPagosAsync(
            request.Search,
            request.PageNumber,
            request.PageSize,
            cancellationToken);

        var data = titulares
            .Select(TitularMapper.MapearAResponse)
            .ToList();

        return data.ToResponsePagination(totalCount);
    }
}
