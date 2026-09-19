using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Resultado de una consulta al motor de ruteo.</summary>
/// <param name="DistanciaMetros">Distancia por calles, en metros enteros.</param>
/// <param name="DuracionSegundos">Duración estimada sin tráfico, en segundos enteros.</param>
/// <param name="GeometriaPolyline">Geometría codificada para dibujar la ruta, o null si no se pidió.</param>
public sealed record RutaCalculada(int DistanciaMetros, int DuracionSegundos, string? GeometriaPolyline);

/// <summary>
/// Motor de ruteo por calles. La implementación concreta vive en Infrastructure.
/// </summary>
/// <remarks>
/// Los resultados de este proveedor se persisten. No debe llamarse al renderizar pantallas:
/// solo cuando cambia un pin o cambian las asignaciones de horario.
/// </remarks>
public interface IRutaProvider
{
    /// <summary>Calcula la ruta entre dos puntos.</summary>
    /// <returns>La ruta, o <c>null</c> si el motor no encontró camino o falló.</returns>
    Task<RutaCalculada?> CalcularRutaAsync(
        Coordenada origen,
        Coordenada destino,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calcula la ruta que pasa por todas las paradas y termina en el destino,
    /// dejando que el motor elija el mejor orden de paradas.
    /// </summary>
    /// <param name="paradas">Puntos de recogida. Si está vacío, devuelve null.</param>
    /// <param name="destino">Punto final, típicamente el colegio.</param>
    /// <returns>La ruta completa, o <c>null</c> si no hay paradas o el motor falló.</returns>
    Task<RutaCalculada?> CalcularRutaOptimizadaAsync(
        IReadOnlyList<Coordenada> paradas,
        Coordenada destino,
        CancellationToken cancellationToken = default);
}
