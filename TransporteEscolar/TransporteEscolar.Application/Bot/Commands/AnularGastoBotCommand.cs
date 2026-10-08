using MediatR;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Application.Bot.Commands;

/// <summary>
/// Anula (borra) un gasto que cargó el bot, siempre que sea variable y haya pasado menos de 24 horas.
/// </summary>
public sealed record AnularGastoBotCommand(int GastoId) : IRequest<Unit>;

public sealed class AnularGastoBotCommandHandler : IRequestHandler<AnularGastoBotCommand, Unit>
{
    private readonly IGastoRepository _gastoRepository;
    private readonly TimeProvider _timeProvider;

    public AnularGastoBotCommandHandler(IGastoRepository gastoRepository, TimeProvider timeProvider)
    {
        _gastoRepository = gastoRepository;
        _timeProvider = timeProvider;
    }

    public async Task<Unit> Handle(AnularGastoBotCommand request, CancellationToken cancellationToken)
    {
        var gasto = await _gastoRepository.ObtenerGastoMensualPorIdAsync(request.GastoId, cancellationToken)
            ?? throw new NotFoundException(nameof(GastoMensual), request.GastoId);

        if (gasto.Tipo != GastoMensual.TipoVariable || !gasto.EsDeBot)
            throw new BusinessRuleException("Solo se pueden anular gastos cargados por el bot.");

        if (!gasto.DentroDelPlazoDeAnulacion(_timeProvider.GetUtcNow().UtcDateTime))
            throw new BusinessRuleException(
                $"Pasó el plazo para anular este gasto ({GastoMensual.HorasParaAnularPorBot} horas). Borralo desde la app.");

        await _gastoRepository.EliminarGastoMensualAsync(gasto, cancellationToken);
        return Unit.Value;
    }
}
