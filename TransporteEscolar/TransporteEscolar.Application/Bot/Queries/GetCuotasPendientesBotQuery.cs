using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Bot.Queries;

/// <summary>
/// Devuelve las cuotas con saldo pendiente de un titular activo, para que el bot de pagos muestre cuánto debe.
/// </summary>
/// <param name="TitularId">Titular a consultar.</param>
public sealed record GetCuotasPendientesBotQuery(int TitularId) : IRequest<BotPagoModel.CuotasResponse>;

public sealed class GetCuotasPendientesBotQueryHandler
    : IRequestHandler<GetCuotasPendientesBotQuery, BotPagoModel.CuotasResponse>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public GetCuotasPendientesBotQueryHandler(
        ITitularRepository titularRepository,
        IPagoMensualRepository pagoMensualRepository)
    {
        _titularRepository = titularRepository;
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<BotPagoModel.CuotasResponse> Handle(
        GetCuotasPendientesBotQuery request,
        CancellationToken cancellationToken)
    {
        var titular = await _titularRepository.GetByIdAsync(request.TitularId, cancellationToken);

        // Un titular de baja se trata igual que uno inexistente: no se le cobra desde el bot.
        if (titular is null || titular.FechaBaja is not null)
            throw new NotFoundException(nameof(Titular), request.TitularId);

        var cuotas = await _pagoMensualRepository.GetByTitularIdAsync(request.TitularId, cancellationToken);

        var pendientes = cuotas
            .Where(c => c.SaldoPendiente() > 0)
            .OrderBy(c => c.Anio)
            .ThenBy(c => c.Mes)
            .Select(c => new BotPagoModel.CuotaItem(c.Anio, c.Mes, c.MontoGenerado, c.SaldoPendiente()))
            .ToList();

        return new BotPagoModel.CuotasResponse(titular.Id, titular.Apellido, pendientes);
    }
}
