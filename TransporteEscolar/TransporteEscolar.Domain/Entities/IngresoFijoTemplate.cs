namespace TransporteEscolar.Domain.Entities;

public class IngresoFijoTemplate
{
    public int Id { get; private set; }
    public string Categoria { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public decimal Monto { get; private set; }
    public int DiaDeAplicacion { get; private set; }
    public string MedioCobro { get; private set; } = null!;
    public string? Observaciones { get; private set; }
    public DateTime FechaInicio { get; private set; }
    public bool EstaActivo { get; private set; }

    public ICollection<IngresoMensual> IngresosGenerados { get; private set; }

    private IngresoFijoTemplate()
    {
        IngresosGenerados = new List<IngresoMensual>();
    }

    public IngresoFijoTemplate(
        string categoria,
        string descripcion,
        decimal monto,
        int diaDeAplicacion,
        string medioCobro,
        DateTime fechaInicio,
        string? observaciones = null,
        bool estaActivo = true)
    {
        Categoria = categoria;
        Descripcion = descripcion;
        Monto = monto;
        DiaDeAplicacion = diaDeAplicacion;
        MedioCobro = medioCobro;
        Observaciones = observaciones;
        FechaInicio = DateTime.SpecifyKind(fechaInicio.Date, DateTimeKind.Utc);
        EstaActivo = estaActivo;
        IngresosGenerados = new List<IngresoMensual>();
    }

    public IngresoMensual CrearInstanciaMensual(
        int mes,
        int anio,
        string estadoCobro = IngresoMensual.EstadoCobroPendiente,
        string? observaciones = null)
    {
        var fecha = CrearFechaParaMes(mes, anio);
        return new IngresoMensual(
            mes,
            anio,
            IngresoMensual.TipoFijo,
            Categoria,
            Descripcion,
            Monto,
            fecha,
            MedioCobro,
            estadoCobro,
            observaciones ?? Observaciones,
            Id);
    }

    private DateTime CrearFechaParaMes(int mes, int anio)
    {
        var diasDelMes = DateTime.DaysInMonth(anio, mes);
        var dia = Math.Clamp(DiaDeAplicacion, 1, diasDelMes);
        return new DateTime(anio, mes, dia, 0, 0, 0, DateTimeKind.Utc);
    }
}
