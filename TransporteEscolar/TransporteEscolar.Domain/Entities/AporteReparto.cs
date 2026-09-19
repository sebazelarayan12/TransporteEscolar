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

    /// <summary>Constructor para EF Core.</summary>
    private AporteReparto()
    {
    }

    internal AporteReparto(int titularId, int metrosAsignados)
    {
        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        TitularId = titularId;
        MetrosAsignados = Math.Max(0, metrosAsignados);
    }

    internal void ActualizarMetros(int metrosAsignados)
    {
        MetrosAsignados = Math.Max(0, metrosAsignados);
    }
}
