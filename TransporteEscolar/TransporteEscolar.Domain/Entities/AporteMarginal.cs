namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Cuántos metros crece el recorrido de un horario por incluir a un titular.
/// Es la medida honesta del costo de esa familia, a diferencia de la distancia directa.
/// </summary>
public class AporteMarginal
{
    public int Id { get; private set; }

    public int RecorridoHorarioId { get; private set; }

    public int TitularId { get; private set; }

    /// <summary>Metros que se ahorrarían si esta familia no estuviera en el recorrido. Nunca negativo.</summary>
    public int MetrosMarginales { get; private set; }

    /// <summary>Constructor para EF Core.</summary>
    private AporteMarginal()
    {
    }

    internal AporteMarginal(int titularId, int metrosMarginales)
    {
        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        TitularId = titularId;
        MetrosMarginales = Math.Max(0, metrosMarginales);
    }

    internal void ActualizarMetros(int metrosMarginales)
    {
        MetrosMarginales = Math.Max(0, metrosMarginales);
    }
}
