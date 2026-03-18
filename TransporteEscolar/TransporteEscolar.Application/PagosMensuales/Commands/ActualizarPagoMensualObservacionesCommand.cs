using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record ActualizarPagoMensualObservacionesCommand(
    int PagoMensualId,
    PagoMensualModel.UpdateObservacionesRequest Payload) : IRequest<Unit>;

public sealed class ActualizarPagoMensualObservacionesCommandHandler : IRequestHandler<ActualizarPagoMensualObservacionesCommand, Unit>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public ActualizarPagoMensualObservacionesCommandHandler(IPagoMensualRepository pagoMensualRepository)
    {
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<Unit> Handle(ActualizarPagoMensualObservacionesCommand request, CancellationToken cancellationToken)
    {
        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _pagoMensualRepository.GetByIdAsync,
            request.PagoMensualId,
            nameof(PagoMensual),
            cancellationToken);

        pagoMensual.ActualizarObservaciones(request.Payload.Observaciones);
        await _pagoMensualRepository.UpdateAsync(pagoMensual, cancellationToken);

        return Unit.Value;
    }
}
