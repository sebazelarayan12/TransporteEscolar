using MediatR;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Application.Bot.Queries;

/// <summary>
/// Busca las familias activas que tienen registrado un teléfono. Lo consume el bot de inasistencias.
/// </summary>
/// <param name="Numero">Número tal como lo manda el bot (por ejemplo, 549 + área + abonado).</param>
public sealed record GetTitularPorTelefonoQuery(string? Numero) : IRequest<BotModel.Response>;

public sealed class GetTitularPorTelefonoQueryHandler
    : IRequestHandler<GetTitularPorTelefonoQuery, BotModel.Response>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly ILogger<GetTitularPorTelefonoQueryHandler> _logger;

    public GetTitularPorTelefonoQueryHandler(
        ITitularRepository titularRepository,
        IPasajeroRepository pasajeroRepository,
        ILogger<GetTitularPorTelefonoQueryHandler> logger)
    {
        _titularRepository = titularRepository;
        _pasajeroRepository = pasajeroRepository;
        _logger = logger;
    }

    public async Task<BotModel.Response> Handle(
        GetTitularPorTelefonoQuery request,
        CancellationToken cancellationToken)
    {
        // Sin dígitos no es un teléfono: eso sí es un error del cliente (400).
        BotValidator.ValidarNumero(request.Numero);

        // Con dígitos pero no normalizable (ids @lid de WhatsApp, números cortos) es un
        // resultado normal sin coincidencias, no un error.
        var canonico = TelefonoNormalizador.ANacional(request.Numero);
        if (canonico is null)
            return Vacio();

        // Son cientos de filas como mucho: se normaliza en memoria para tolerar cualquier formato guardado.
        var telefonos = await _titularRepository.GetTelefonosActivosAsync(cancellationToken);
        var titularIds = telefonos
            .Where(t => TelefonoNormalizador.ANacional(t.NumeroE164) == canonico)
            .Select(t => t.TitularId)
            .Distinct()
            .ToList();

        if (titularIds.Count == 0)
        {
            RegistrarResultado(0, canonico);
            return Vacio();
        }

        var titulares = await _titularRepository.GetByIdsAsync(titularIds, cancellationToken);
        // Defensa en profundidad: aunque el repositorio ya filtra, un titular de baja nunca sale.
        var titularesActivos = titulares.Where(t => t.FechaBaja is null).ToList();

        if (titularesActivos.Count == 0)
        {
            RegistrarResultado(0, canonico);
            return Vacio();
        }

        var pasajeros = await _pasajeroRepository.GetNombresActivosPorTitularesAsync(
            titularesActivos.Select(t => t.Id).ToList(),
            cancellationToken);

        var pasajerosPorTitular = pasajeros
            .GroupBy(p => p.TitularId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var coincidencias = titularesActivos
            .OrderBy(t => t.Apellido, StringComparer.Ordinal)
            .ThenBy(t => t.NombreContacto, StringComparer.Ordinal)
            .Select(t => new BotModel.Coincidencia(
                t.Id,
                t.Apellido,
                t.NombreContacto,
                pasajerosPorTitular.TryGetValue(t.Id, out var delTitular)
                    ? delTitular
                        .OrderBy(p => p.Nombre, StringComparer.Ordinal)
                        .Select(p => new BotModel.PasajeroBasico(p.Id, p.Nombre))
                        .ToList()
                    : new List<BotModel.PasajeroBasico>()))
            .ToList();

        RegistrarResultado(coincidencias.Count, canonico);
        return new BotModel.Response(coincidencias);
    }

    private static BotModel.Response Vacio() => new(new List<BotModel.Coincidencia>());

    // Nunca se registra el número completo: solo la cantidad de coincidencias y los últimos 4 dígitos.
    private void RegistrarResultado(int cantidad, string canonico)
    {
        _logger.LogInformation(
            "Bot: búsqueda por teléfono con {Cantidad} coincidencia(s) para el número {NumeroEnmascarado}",
            cantidad,
            TelefonoNormalizador.UltimosCuatro(canonico));
    }
}
