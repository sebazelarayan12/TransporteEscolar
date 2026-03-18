using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagosMensualesVencidosQuery : IRequest<List<PagoMensualModel.Response>>;

public sealed class GetPagosMensualesVencidosQueryHandler : IRequestHandler<GetPagosMensualesVencidosQuery, List<PagoMensualModel.Response>>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagosMensualesVencidosQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<PagoMensualModel.Response>> Handle(GetPagosMensualesVencidosQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetVencidosAsync(cancellationToken);
        return pagos.ToResponseList();
    }
}
