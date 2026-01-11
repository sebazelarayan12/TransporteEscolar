namespace TransporteEscolar.Domain.Entities;

public class TitularTelefono
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public string NumeroE164 { get; private set; } = null!;
    public bool EsPrincipal { get; private set; }
    public DateTime FechaAlta { get; private set; }
    public DateTime? FechaBaja { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;

    // Constructor para EF Core
    private TitularTelefono() { }

    // Constructor para creación
    public TitularTelefono(int titularId, string numeroE164, bool esPrincipal = false)
    {
        TitularId = titularId;
        NumeroE164 = numeroE164;
        EsPrincipal = esPrincipal;
        FechaAlta = DateTime.UtcNow.Date;
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