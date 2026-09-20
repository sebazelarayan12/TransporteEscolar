using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Resultado de una consulta al motor de ruteo.</summary>
/// <param name="DistanciaMetros">Distancia por calles, en metros enteros.</param>
/// <param name="DuracionSegundos">Duración estimada sin tráfico, en segundos enteros.</param>
/// <param name="GeometriaPolyline">Geometría codificada para dibujar la ruta, o null si no se pidió.</param>
public sealed record RutaCalculada(int DistanciaMetros, int DuracionSegundos, string? GeometriaPolyline);

/// <summary>Matrices de un viaje: metros y segundos entre cada par de puntos.</summary>
/// <param name="Distancias"><c>Distancias[i][j]</c> = metros de <c>i</c> a <c>j</c>.</param>
/// <param name="Duraciones"><c>Duraciones[i][j]</c> = segundos de <c>i</c> a <c>j</c>.</param>
public sealed record MatrizViaje(double[][] Distancias, double[][] Duraciones);

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

    /// <summary>
    /// Devuelve las matrices de distancia y duración entre todos los puntos indicados.
    /// </summary>
    /// <param name="puntos">Puntos a medir. El resultado es cuadrado, del mismo tamaño.</param>
    /// <returns><c>null</c> si el motor falló o si algún par resultó inalcanzable.</returns>
    Task<MatrizViaje?> CalcularMatricesAsync(
        IReadOnlyList<Coordenada> puntos,
        CancellationToken cancellationToken = default);
}
