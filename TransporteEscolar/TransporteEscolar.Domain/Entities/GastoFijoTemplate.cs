namespace TransporteEscolar.Domain.Entities;

public class GastoFijoTemplate
{
    public int Id { get; private set; }
    public string Categoria { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public decimal Monto { get; private set; }
    public int DiaDeAplicacion { get; private set; }
    public string MedioPago { get; private set; } = null!;
    public bool EstaActivo { get; private set; }
    public DateTime FechaInicio { get; private set; }

    public ICollection<GastoMensual> GastosGenerados { get; private set; } = null!;

    private GastoFijoTemplate()
    {
        GastosGenerados = new List<GastoMensual>();
    }

    public GastoFijoTemplate(
        string categoria,
        string descripcion,
        decimal monto,
        int diaDeAplicacion,
        string medioPago,
        DateTime fechaInicio,
        bool estaActivo = true)
    {
        Categoria = categoria;
        Descripcion = descripcion;
        Monto = monto;
        DiaDeAplicacion = diaDeAplicacion;
        MedioPago = medioPago;
        EstaActivo = estaActivo;
        FechaInicio = DateTime.SpecifyKind(fechaInicio.Date, DateTimeKind.Utc);
        GastosGenerados = new List<GastoMensual>();
    }

    public GastoMensual CrearInstanciaMensual(int mes, int anio, string estadoPago = "Pendiente", string? observaciones = null)
    {
        var fecha = CrearFechaParaMes(mes, anio);
        return new GastoMensual(
            mes,
            anio,
            GastoMensual.TipoFijo,
            Categoria,
            Descripcion,
            Monto,
            fecha,
            MedioPago,
            estadoPago,
            observaciones,
            Id);
    }

    public void ActualizarDatos(
        string categoria,
        string descripcion,
        decimal monto,
        int diaDeAplicacion,
        string medioPago,
        bool estaActivo)
    {
        Categoria = categoria;
        Descripcion = descripcion;
        Monto = monto;
        DiaDeAplicacion = diaDeAplicacion;
        MedioPago = medioPago;
        EstaActivo = estaActivo;
    }

    public void Desactivar()
    {
        EstaActivo = false;
    }

    private DateTime CrearFechaParaMes(int mes, int anio)
    {
        var diasDelMes = DateTime.DaysInMonth(anio, mes);
        var dia = Math.Clamp(DiaDeAplicacion, 1, diasDelMes);
        return new DateTime(anio, mes, dia, 0, 0, 0, DateTimeKind.Utc);
    }
}
