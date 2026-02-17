namespace TransporteEscolar.Domain.Entities;

public class IngresoMensual
{
    public const string TipoFijo = "Fijo";
    public const string TipoVariable = "Variable";
    public const string EstadoCobroPendiente = "Pendiente";

    public int Id { get; private set; }
    public int Mes { get; private set; }
    public int Anio { get; private set; }
    public string Tipo { get; private set; } = null!;
    public string Categoria { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public decimal Monto { get; private set; }
    public DateTime Fecha { get; private set; }
    public string MedioCobro { get; private set; } = null!;
    public string EstadoCobro { get; private set; } = null!;
    public string? Observaciones { get; private set; }
    public int? IngresoFijoTemplateId { get; private set; }

    public IngresoFijoTemplate? IngresoFijoTemplate { get; private set; }

    private IngresoMensual()
    {
    }

    public IngresoMensual(
        int mes,
        int anio,
        string tipo,
        string categoria,
        string descripcion,
        decimal monto,
        DateTime fecha,
        string medioCobro,
        string estadoCobro,
        string? observaciones = null,
        int? ingresoFijoTemplateId = null)
    {
        Mes = mes;
        Anio = anio;
        Tipo = tipo;
        Categoria = categoria;
        Descripcion = descripcion;
        Monto = monto;
        Fecha = DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);
        MedioCobro = medioCobro;
        EstadoCobro = estadoCobro;
        Observaciones = observaciones;
        IngresoFijoTemplateId = ingresoFijoTemplateId;
    }
}
