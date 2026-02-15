namespace TransporteEscolar.Domain.Entities;

public class Horario
{
    public int Id { get; private set; }
    public string Etiqueta { get; private set; } = null!;
    public int Orden { get; private set; }

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
}
