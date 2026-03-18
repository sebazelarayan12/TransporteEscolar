using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagoMensualByIdQuery(int Id) : IRequest<PagoMensualModel.Response?>;

public sealed class GetPagoMensualByIdQueryHandler : IRequestHandler<GetPagoMensualByIdQuery, PagoMensualModel.Response?>
{
    private readonly IPagoMensualRepository _repository;

    public GetPagoMensualByIdQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagoMensualModel.Response?> Handle(GetPagoMensualByIdQuery request, CancellationToken cancellationToken)
    {
        var pago = await _repository.GetByIdAsync(request.Id, cancellationToken);
        return pago?.ToResponse();
    }
}
