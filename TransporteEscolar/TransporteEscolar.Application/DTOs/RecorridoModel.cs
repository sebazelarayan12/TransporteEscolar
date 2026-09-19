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

    /// <summary>Una fila del análisis: un titular con sus kilómetros y su precio por kilómetro.</summary>
    /// <param name="TitularId">Id del titular.</param>
    /// <param name="Apellido">Apellido, para mostrar.</param>
    /// <param name="MontoMensual">Cuota mensual pactada.</param>
    /// <param name="Colegios">Nombres de los colegios a los que van sus pasajeros.</param>
    /// <param name="KilometrosMensuales">Suma de kilómetros mensuales de todos sus recorridos.</param>
    /// <param name="PrecioPorKilometro">
    /// Cuota dividida por los kilómetros. Es <c>null</c> cuando no hay kilómetros calculados:
    /// significa "sin dato", no "cobra cero".
    /// </param>
    /// <param name="TieneUbicacion">Si el titular tiene el pin cargado.</param>
    /// <param name="KilometrosAsignadosMensuales">
    /// Kilómetros al mes que le corresponden a este titular según el reparto por valor de
    /// Shapley. Es 0 si todavía no se calculó el reparto.
    /// </param>
    /// <param name="PrecioPorKilometroAsignado">
    /// Cuota dividida por los kilómetros asignados, o <c>null</c> si no hay dato.
    /// </param>
    public sealed record AnalisisFila(
        int TitularId,
        string Apellido,
        decimal MontoMensual,
        IReadOnlyCollection<string> Colegios,
        decimal KilometrosMensuales,
        decimal? PrecioPorKilometro,
        bool TieneUbicacion,
        decimal KilometrosAsignadosMensuales,
        decimal? PrecioPorKilometroAsignado);

    /// <summary>Viaje que no se pudo repartir porque le falta la casa fija.</summary>
    /// <param name="HorarioId">Id del horario del viaje.</param>
    /// <param name="HorarioEtiqueta">Etiqueta del horario, para mostrar.</param>
    /// <param name="Transporte">Vehículo: 1 (Ducato) o 2 (Sprinter).</param>
    /// <param name="Motivo">Texto listo para mostrar: por qué quedó pendiente.</param>
    public sealed record ViajePendiente(
        int HorarioId,
        string HorarioEtiqueta,
        byte Transporte,
        string Motivo);

    /// <summary>Resumen de una corrida de reparto de kilómetros.</summary>
    /// <param name="ViajesProcesados">Pares (horario, vehículo) repartidos.</param>
    /// <param name="ConsultasRealizadas">Llamadas al motor de ruteo: una por viaje.</param>
    /// <param name="Fallidos">Viajes donde el motor no devolvió una matriz utilizable.</param>
    /// <param name="ViajesAproximados">
    /// Viajes que superaron el umbral de cálculo exacto y se repartieron proporcionalmente.
    /// </param>
    /// <param name="Pendientes">
    /// Viajes que no se calcularon porque les falta la casa fija, o porque la marcada ya no
    /// corresponde a un participante con ubicación cargada.
    /// </param>
    public sealed record RecalculoRepartoResponse(
        int ViajesProcesados,
        int ConsultasRealizadas,
        int Fallidos,
        int ViajesAproximados,
        IReadOnlyCollection<ViajePendiente> Pendientes);

    /// <summary>Resultado completo del análisis de kilómetros.</summary>
    public sealed record AnalisisResponse(
        IReadOnlyCollection<AnalisisFila> Filas,
        decimal KilometrosTotales,
        decimal RecaudacionTotal,
        decimal? PrecioPromedioPorKilometro,
        int TitularesSinUbicacion);
}
