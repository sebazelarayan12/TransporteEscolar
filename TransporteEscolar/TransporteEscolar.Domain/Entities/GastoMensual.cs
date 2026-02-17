namespace TransporteEscolar.Domain.Entities;

public class GastoMensual
{
    public const string TipoFijo = "Fijo";
    public const string TipoVariable = "Variable";

    public int Id { get; private set; }
    public int Mes { get; private set; }
    public int Anio { get; private set; }
    public string Tipo { get; private set; } = null!;
    public string Categoria { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public decimal Monto { get; private set; }
    public DateTime Fecha { get; private set; }
    public string MedioPago { get; private set; } = null!;
    public string EstadoPago { get; private set; } = null!;
    public string? Observaciones { get; private set; }
    public int? GastoFijoTemplateId { get; private set; }

    public GastoFijoTemplate? GastoFijoTemplate { get; private set; }

    private GastoMensual()
    {
    }

    public GastoMensual(
        int mes,
        int anio,
        string tipo,
        string categoria,
        string descripcion,
        decimal monto,
        DateTime fecha,
        string medioPago,
        string estadoPago,
        string? observaciones = null,
        int? gastoFijoTemplateId = null)
    {
        Mes = mes;
        Anio = anio;
        Tipo = tipo;
        Categoria = categoria;
        Descripcion = descripcion;
        Monto = monto;
        Fecha = DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);
        MedioPago = medioPago;
        EstadoPago = estadoPago;
        Observaciones = observaciones;
        GastoFijoTemplateId = gastoFijoTemplateId;
    }
}
