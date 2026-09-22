namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Metros del recorrido de un horario asignados a un titular, calculados con el
/// valor de Shapley. Es el reparto justo del costo real del viaje entre las familias
/// que lo componen.
/// </summary>
public class AporteReparto
{
    public int Id { get; private set; }

    public int RecorridoHorarioId { get; private set; }

    public int TitularId { get; private set; }

    /// <summary>Metros del recorrido asignados a esta familia. Nunca negativo.</summary>
    public int MetrosAsignados { get; private set; }

    /// <summary>Posición de esta parada dentro del orden real de visita del viaje (1-based).</summary>
    public int Orden { get; private set; }

    /// <summary>
    /// Metros desde el punto anterior del recorrido hasta esta casa. Nunca negativo. Cero cuando
    /// esta parada es la primera del recorrido (ver la convención de tramos en <see cref="RecorridoHorario"/>).
    /// </summary>
    public int MetrosTramoAnterior { get; private set; }

    /// <summary>Constructor para EF Core.</summary>
    private AporteReparto()
    {
    }

    internal AporteReparto(int titularId, int metrosAsignados, int orden, int metrosTramoAnterior)
    {
        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        if (orden <= 0)
            throw new ArgumentOutOfRangeException(nameof(orden), orden, "El orden debe ser mayor a cero");

        TitularId = titularId;
        MetrosAsignados = Math.Max(0, metrosAsignados);
        Orden = orden;
        MetrosTramoAnterior = Math.Max(0, metrosTramoAnterior);
    }

    internal void ActualizarMetros(int metrosAsignados, int orden, int metrosTramoAnterior)
    {
        if (orden <= 0)
            throw new ArgumentOutOfRangeException(nameof(orden), orden, "El orden debe ser mayor a cero");

        MetrosAsignados = Math.Max(0, metrosAsignados);
        Orden = orden;
        MetrosTramoAnterior = Math.Max(0, metrosTramoAnterior);
    }
}
