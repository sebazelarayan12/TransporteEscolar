using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagosMensualesQuery : IRequest<List<PagoMensualModel.Response>>;

public sealed class GetPagosMensualesQueryHandler : IRequestHandler<GetPagosMensualesQuery, List<PagoMensualModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagosMensualesQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PagoMensualModel.Response>> Handle(GetPagosMensualesQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetAllAsync(cancellationToken);
        return pagos.ToResponseList();
    }
}
