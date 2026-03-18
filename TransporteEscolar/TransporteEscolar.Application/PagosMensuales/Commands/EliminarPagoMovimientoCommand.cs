using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record EliminarPagoMovimientoCommand(int PagoMensualId, int MovimientoId) : IRequest<PagoMovimientoModel.Response>;

public sealed class EliminarPagoMovimientoCommandHandler : IRequestHandler<EliminarPagoMovimientoCommand, PagoMovimientoModel.Response>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public EliminarPagoMovimientoCommandHandler(IPagoMensualRepository pagoMensualRepository)
    {
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<PagoMovimientoModel.Response> Handle(EliminarPagoMovimientoCommand request, CancellationToken cancellationToken)
    {
        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _pagoMensualRepository.GetByIdAsync,
            request.PagoMensualId,
            nameof(PagoMensual),
            cancellationToken);

        var movimiento = pagoMensual.Movimientos.FirstOrDefault(m => m.Id == request.MovimientoId);
        if (movimiento == null)
        {
            var existe = await _pagoMensualRepository.GetMovimientoByIdAsync(request.MovimientoId, cancellationToken);
            if (existe == null)
                throw new NotFoundException(nameof(PagoMovimiento), request.MovimientoId);

            throw new ValidationException("El movimiento no pertenece al pago mensual indicado.");
        }

        PagoMovimiento movimientoEliminado;
        try
        {
            movimientoEliminado = pagoMensual.EliminarMovimiento(request.MovimientoId);
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        await _pagoMensualRepository.UpdateAsync(pagoMensual, cancellationToken);

        return movimientoEliminado.ToPagoMovimientoResponse(pagoMensual);
    }
}
