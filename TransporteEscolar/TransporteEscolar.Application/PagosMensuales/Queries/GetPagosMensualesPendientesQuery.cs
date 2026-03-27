using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagosMensualesPendientesQuery : IRequest<List<PagoMensualModel.Response>>;

public sealed class GetPagosMensualesPendientesQueryHandler : IRequestHandler<GetPagosMensualesPendientesQuery, List<PagoMensualModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagosMensualesPendientesQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PagoMensualModel.Response>> Handle(GetPagosMensualesPendientesQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetPendientesAsync(cancellationToken);
        return pagos.ToResponseList();
    }
}
