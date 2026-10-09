using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.Bot.Queries;

/// <summary>
/// Lista los titulares activos para que el bot de pagos elija a quién le carga el pago.
/// No devuelve dirección, teléfono ni monto pactado.
/// </summary>
public sealed record GetTitularesParaPagosBotQuery : IRequest<List<BotPagoModel.TitularItem>>;

public sealed class GetTitularesParaPagosBotQueryHandler
    : IRequestHandler<GetTitularesParaPagosBotQuery, List<BotPagoModel.TitularItem>>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetTitularesParaPagosBotQueryHandler(
        ITitularRepository titularRepository,
        IPasajeroRepository pasajeroRepository)
    {
        _titularRepository = titularRepository;
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<BotPagoModel.TitularItem>> Handle(
        GetTitularesParaPagosBotQuery request,
        CancellationToken cancellationToken)
    {
        var titulares = await _titularRepository.GetActivosAsync(cancellationToken);
        // Defensa en profundidad: un titular de baja nunca sale aunque el repositorio lo devuelva.
        var titularesActivos = titulares.Where(t => t.FechaBaja is null).ToList();

        if (titularesActivos.Count == 0)
            return new List<BotPagoModel.TitularItem>();

        var pasajeros = await _pasajeroRepository.GetNombresActivosPorTitularesAsync(
            titularesActivos.Select(t => t.Id).ToList(),
            cancellationToken);

        var pasajerosPorTitular = pasajeros
            .GroupBy(p => p.TitularId)
            .ToDictionary(g => g.Key, g => g.Select(p => p.Nombre).OrderBy(n => n, StringComparer.Ordinal).ToList());

        return titularesActivos
            .OrderBy(t => t.Apellido, StringComparer.Ordinal)
            .ThenBy(t => t.NombreContacto, StringComparer.Ordinal)
            .Select(t => new BotPagoModel.TitularItem(
                t.Id,
                t.Apellido,
                t.NombreContacto,
                pasajerosPorTitular.TryGetValue(t.Id, out var nombres)
                    ? nombres
                    : new List<string>()))
            .ToList();
    }
}
