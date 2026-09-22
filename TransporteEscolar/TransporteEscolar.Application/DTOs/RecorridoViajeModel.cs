namespace TransporteEscolar.Application.DTOs;

/// <summary>Recorrido calculado de un viaje concreto, listo para mostrar en pantalla.</summary>
public static class RecorridoViajeModel
{
    /// <summary>Una parada del recorrido, en orden de visita.</summary>
    /// <param name="Orden">Posición de visita, empezando en 1.</param>
    /// <param name="MetrosTramoAnterior">Metros desde el punto anterior del recorrido.</param>
    /// <param name="MetrosAsignados">Metros del viaje que le tocan a esa familia por el reparto.</param>
    /// <param name="EsParadaFija">Si es la casa elegida a mano para anclar el recorrido.</param>
    public sealed record Parada(
        int Orden,
        int TitularId,
        string Apellido,
        int MetrosTramoAnterior,
        int MetrosAsignados,
        bool EsParadaFija);

    /// <summary>Recorrido completo de un par (horario, vehículo).</summary>
    /// <param name="Sentido">Ida o Vuelta: define si el colegio va al final o al principio.</param>
    /// <param name="MetrosTramoFinal">Metros de la última casa al colegio. Cero en los viajes de vuelta.</param>
    public sealed record Response(
        int HorarioId,
        string HorarioEtiqueta,
        string Sentido,
        byte Transporte,
        string ColegioNombre,
        int DistanciaTotalMetros,
        int DuracionTotalSegundos,
        int MetrosTramoFinal,
        DateTime FechaCalculo,
        IReadOnlyCollection<Parada> Paradas);
}
