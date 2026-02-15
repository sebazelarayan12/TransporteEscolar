namespace TransporteEscolar.Domain.Entities;

public class Horario
{
    public int Id { get; private set; }
    public string Etiqueta { get; private set; } = null!;
    public int Orden { get; private set; }

    public ICollection<Pasajero> Pasajeros { get; private set; }

    private Horario()
    {
        Pasajeros = new List<Pasajero>();
    }

    public Horario(string etiqueta, int orden)
    {
        if (string.IsNullOrWhiteSpace(etiqueta))
            throw new ArgumentException("La etiqueta es obligatoria", nameof(etiqueta));

        Etiqueta = etiqueta.Trim();
        Orden = orden;
        Pasajeros = new List<Pasajero>();
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
