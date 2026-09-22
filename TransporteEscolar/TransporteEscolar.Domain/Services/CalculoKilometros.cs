namespace TransporteEscolar.Domain.Services;

/// <summary>
/// Aritmética del negocio de kilómetros. Funciones puras, sin dependencias externas.
/// </summary>
/// <remarks>
/// La unidad de análisis es el par (Titular, Colegio): la combi sale de una casa y va a
/// un colegio. Dos hermanos en el mismo colegio y el mismo horario comparten el viaje.
/// Por eso la cantidad de viajes se deriva contando horarios <b>distintos</b>.
/// </remarks>
public static class CalculoKilometros
{
    /// <summary>
    /// Días hábiles considerados por mes. Decisión de negocio: valor fijo, no calendario real.
    /// Es el único lugar donde vive este número.
    /// </summary>
    public const int DiasHabilesPorMes = 20;

    private const int MetrosPorKilometro = 1000;

    /// <summary>
    /// Cantidad de viajes diarios que hace la combi para un par (titular, colegio).
    /// </summary>
    /// <param name="horarioIds">
    /// Ids de horario de todos los pasajeros de ese titular en ese colegio. Se admiten repetidos:
    /// los hermanos que comparten horario viajan juntos y cuentan una sola vez.
    /// </param>
    /// <returns>Cantidad de horarios distintos.</returns>
    /// <exception cref="ArgumentNullException">Si <paramref name="horarioIds"/> es null.</exception>
    public static int ViajesDiarios(IEnumerable<int> horarioIds)
    {
        ArgumentNullException.ThrowIfNull(horarioIds);

        return horarioIds.Distinct().Count();
    }

    /// <summary>
    /// Kilómetros mensuales de un par (titular, colegio).
    /// </summary>
    /// <param name="distanciaMetros">Distancia de un viaje, en metros, calculada por el motor de ruteo.</param>
    /// <param name="viajesDiarios">Resultado de <see cref="ViajesDiarios"/>.</param>
    /// <returns>Kilómetros por mes.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Si algún parámetro es negativo.</exception>
    public static decimal KilometrosMensuales(int distanciaMetros, int viajesDiarios)
    {
        if (distanciaMetros < 0)
            throw new ArgumentOutOfRangeException(nameof(distanciaMetros), distanciaMetros, "La distancia no puede ser negativa");

        if (viajesDiarios < 0)
            throw new ArgumentOutOfRangeException(nameof(viajesDiarios), viajesDiarios, "Los viajes diarios no pueden ser negativos");

        var kilometrosPorViaje = (decimal)distanciaMetros / MetrosPorKilometro;
        return kilometrosPorViaje * viajesDiarios * DiasHabilesPorMes;
    }

    /// <summary>
    /// Precio cobrado por kilómetro recorrido.
    /// </summary>
    /// <param name="montoMensual">Cuota mensual pactada con el titular.</param>
    /// <param name="kilometrosMensuales">Resultado de <see cref="KilometrosMensuales"/>.</param>
    /// <returns>
    /// Monto por kilómetro, o <c>null</c> si no hay kilómetros para dividir.
    /// Devolver null y no cero es deliberado: significa "sin dato", no "cobra cero".
    /// </returns>
    public static decimal? PrecioPorKilometro(decimal montoMensual, decimal kilometrosMensuales)
    {
        if (kilometrosMensuales <= 0m)
            return null;

        return montoMensual / kilometrosMensuales;
    }
}
