using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagosMensualesPorTitularQuery(int TitularId) : IRequest<List<PagoMensualModel.Response>>;

public sealed class GetPagosMensualesPorTitularQueryHandler : IRequestHandler<GetPagosMensualesPorTitularQuery, List<PagoMensualModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagosMensualesPorTitularQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PagoMensualModel.Response>> Handle(GetPagosMensualesPorTitularQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetByTitularIdAsync(request.TitularId, cancellationToken);
        return pagos.ToResponseList();
    }
}
