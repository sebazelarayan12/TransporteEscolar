namespace TransporteEscolar.Domain.Entities;

public class Horario
{
    public int Id { get; private set; }
    public string Etiqueta { get; private set; } = null!;
    public int Orden { get; private set; }

    /// <summary>
    /// Colegio de destino de este horario. Nullable porque los horarios existen desde antes
    /// que la tabla de colegios, y puede aparecer un horario que no corresponda a un colegio.
    /// </summary>
    public int? ColegioId { get; private set; }

    /// <summary>Navegación al colegio de destino.</summary>
    public Colegio? Colegio { get; private set; }

    public ICollection<PasajeroHorario> PasajeroHorarios { get; private set; }

    private Horario()
    {
        PasajeroHorarios = new List<PasajeroHorario>();
    }

    public Horario(string etiqueta, int orden)
    {
        if (string.IsNullOrWhiteSpace(etiqueta))
            throw new ArgumentException("La etiqueta es obligatoria", nameof(etiqueta));

        Etiqueta = etiqueta.Trim();
        Orden = orden;
        PasajeroHorarios = new List<PasajeroHorario>();
    }

    public void ActualizarEtiqueta(string etiqueta)
    {
        if (string.IsNullOrWhiteSpace(etiqueta))
            throw new ArgumentException("La etiqueta es obligatoria", nameof(etiqueta));

        Etiqueta = etiqueta.Trim();
    }

    public void ActualizarOrden(int orden)
    {
        Orden = orden;
    }

    /// <summary>Vincula el horario con un colegio, o lo desvincula si se pasa null.</summary>
    /// <param name="colegioId">Id del colegio, o null para desvincular.</param>
    /// <exception cref="ArgumentOutOfRangeException">Si el id no es null y es menor o igual a cero.</exception>
    public void AsignarColegio(int? colegioId)
    {
        if (colegioId.HasValue && colegioId.Value <= 0)
            throw new ArgumentOutOfRangeException(nameof(colegioId), colegioId, "El id del colegio debe ser mayor a cero");

        ColegioId = colegioId;
    }
}
