using MediatR;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Application.Bot.Commands;

/// <summary>
/// Anula (borra) todos los movimientos de un pago que cargó el bot, siempre que sean del bot y no hayan pasado 24 horas.
/// </summary>
public sealed record AnularPagoBotCommand(Guid GrupoId) : IRequest<Unit>;

public sealed class AnularPagoBotCommandHandler : IRequestHandler<AnularPagoBotCommand, Unit>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly TimeProvider _timeProvider;

    public AnularPagoBotCommandHandler(IPagoMensualRepository pagoMensualRepository, TimeProvider timeProvider)
    {
        _pagoMensualRepository = pagoMensualRepository;
        _timeProvider = timeProvider;
    }

    public async Task<Unit> Handle(AnularPagoBotCommand request, CancellationToken cancellationToken)
    {
        var movimientos = await _pagoMensualRepository.GetMovimientosPorGrupoIdAsync(request.GrupoId, cancellationToken);
        if (movimientos.Count == 0)
            throw new NotFoundException("Pago del bot", request.GrupoId);

        if (movimientos.Any(m => !m.EsDeBot))
            throw new BusinessRuleException("Solo se pueden anular pagos cargados por el bot.");

        var ahora = _timeProvider.GetUtcNow().UtcDateTime;
        if (movimientos.Any(m => !m.DentroDelPlazoDeAnulacion(ahora)))
            throw new BusinessRuleException(
                $"Pasó el plazo para anular este pago ({PagoMovimiento.HorasParaAnularPorBot} horas). Anulalo desde la app.");

        await _pagoMensualRepository.EliminarMovimientosAsync(movimientos, cancellationToken);
        return Unit.Value;
    }
}
