namespace TransporteEscolar.Application.DTOs;

/// <summary>DTOs del módulo de recorridos.</summary>
public static class RecorridoModel
{
    /// <summary>Recorrido calculado de un titular hacia un colegio.</summary>
    /// <param name="ColegioId">Colegio de destino.</param>
    /// <param name="ColegioNombre">Nombre del colegio, para mostrar.</param>
    /// <param name="DistanciaMetros">Distancia de un viaje.</param>
    /// <param name="DuracionSegundos">Duración estimada sin tráfico.</param>
    /// <param name="ViajesDiarios">Cantidad de horarios distintos de ese colegio.</param>
    /// <param name="KilometrosMensuales">Kilómetros al mes, ya multiplicados por viajes y días hábiles.</param>
    /// <param name="GeometriaPolyline">Geometría para dibujar la ruta.</param>
    /// <param name="FechaCalculo">Cuándo se calculó.</param>
    public sealed record Response(
        int ColegioId,
        string ColegioNombre,
        int DistanciaMetros,
        int DuracionSegundos,
        int ViajesDiarios,
        decimal KilometrosMensuales,
        string? GeometriaPolyline,
        DateTime FechaCalculo);

    /// <summary>Resumen de una corrida de recálculo.</summary>
    /// <param name="Calculados">Recorridos que se consultaron al motor y se guardaron.</param>
    /// <param name="Omitidos">Recorridos que ya estaban vigentes y no se recalcularon.</param>
    /// <param name="Fallidos">Recorridos donde el motor no devolvió ruta.</param>
    /// <param name="TitularesSinUbicacion">Titulares con pasajeros asignados pero sin pin cargado.</param>
    public sealed record RecalculoResponse(
        int Calculados,
        int Omitidos,
        int Fallidos,
        IReadOnlyCollection<int> TitularesSinUbicacion);
}
