namespace TransporteEscolar.Domain.Entities;

public class TitularTelefono
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public string Numero { get; private set; } = null!;
    public bool EsPrincipal { get; private set; }
    public DateTime FechaAlta { get; private set; }
    public DateTime? FechaBaja { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;

    // Constructor para EF Core
    private TitularTelefono() { }

    // Constructor para creación
    public TitularTelefono(int titularId, string numero, bool esPrincipal = false)
    {
        if (titularId <= 0)
            throw new ArgumentException("TitularId inválido", nameof(titularId));
        
        if (string.IsNullOrWhiteSpace(numero))
            throw new ArgumentException("El número no puede estar vacío", nameof(numero));

        TitularId = titularId;
        Numero = numero;
        EsPrincipal = esPrincipal;
        FechaAlta = DateTime.UtcNow;
    }

    public void MarcarComoPrincipal()
    {
        EsPrincipal = true;
    }

    public void DesmarcarComoPrincipal()
    {
        EsPrincipal = false;
    }

    public void DarDeBaja()
    {
        FechaBaja = DateTime.UtcNow;
        EsPrincipal = false;
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }
}