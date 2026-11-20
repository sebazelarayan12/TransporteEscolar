namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Decisión de diciembre de un titular para un año: si su familia manda a los hijos ("va") y, en ese caso,
/// el monto de la cuota. El estado "pendiente" es no tener fila. Es independiente del flujo de reinscripciones.
/// </summary>
public class ConfirmacionDiciembre
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public int Anio { get; private set; }
    public bool Va { get; private set; }
    public decimal? Monto { get; private set; }
    public int? PagoMensualId { get; private set; }
    public DateTime FechaDecision { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;
    public PagoMensual? PagoMensual { get; private set; }

    // Constructor para EF Core
    private ConfirmacionDiciembre()
    {
    }

    // Constructor para creación
    public ConfirmacionDiciembre(
        int titularId,
        int anio,
        bool va,
        decimal? monto,
        PagoMensual? pagoMensual,
        DateTime fechaDecision)
    {
        TitularId = titularId;
        Anio = anio;
        Va = va;
        Monto = monto;
        Vincular(pagoMensual);
        FechaDecision = NormalizarFechaUtc(fechaDecision);
    }

    /// <summary>Marca que el titular va, con la cuota de diciembre (nueva o adoptada) y su monto.</summary>
    public void RegistrarVa(decimal monto, PagoMensual cuota, DateTime fechaDecision)
    {
        Va = true;
        Monto = monto;
        Vincular(cuota);
        FechaDecision = NormalizarFechaUtc(fechaDecision);
    }

    /// <summary>Marca que el titular no va. Desvincula la cuota (la que se elimina aparte, si corresponde).</summary>
    public void RegistrarNoVa(DateTime fechaDecision)
    {
        Va = false;
        Monto = null;
        Vincular(null);
        FechaDecision = NormalizarFechaUtc(fechaDecision);
    }

    private void Vincular(PagoMensual? cuota)
    {
        PagoMensual = cuota;
        // Una cuota nueva aún sin Id se vincula por navegación: EF completa la clave al guardar.
        PagoMensualId = cuota is { Id: > 0 } ? cuota.Id : null;
    }

    private static DateTime NormalizarFechaUtc(DateTime valor)
    {
        return valor.Kind switch
        {
            DateTimeKind.Utc => valor,
            DateTimeKind.Local => valor.ToUniversalTime(),
            _ => DateTime.SpecifyKind(valor, DateTimeKind.Utc)
        };
    }
}
