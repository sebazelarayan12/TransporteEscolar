using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Domain.Entities;

public class GastoFijoTemplate
{
    public int Id { get; private set; }
    public string Categoria { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public decimal MontoOriginal { get; private set; }
    public decimal MontoCuota { get; private set; }
    public int DiaDeAplicacion { get; private set; }
    public string MedioPago { get; private set; } = null!;
    public bool EstaActivo { get; private set; }
    public DateTime FechaInicio { get; private set; }
    public bool EsPlanCuotas { get; private set; }
    public int? CantidadCuotas { get; private set; }
    public DateTime? FechaPrimeraCuota { get; private set; }

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
        bool estaActivo = true,
        bool esPlanCuotas = false,
        DateTime? fechaPrimeraCuota = null,
        int? cantidadCuotas = null)
    {
        Categoria = categoria;
        Descripcion = descripcion;
        DiaDeAplicacion = diaDeAplicacion;
        MedioPago = medioPago;
        EstaActivo = estaActivo;
        FechaInicio = DateTime.SpecifyKind(fechaInicio.Date, DateTimeKind.Utc);
        GastosGenerados = new List<GastoMensual>();

        ConfigurarMontos(monto, esPlanCuotas, fechaPrimeraCuota, cantidadCuotas);
    }

    public GastoMensual CrearInstanciaMensual(int mes, int anio, string? observaciones = null)
    {
        var fecha = CrearFechaParaMes(mes, anio);
        var numeroCuota = CalcularNumeroCuotaPara(mes, anio);
        var totalCuotas = EsPlanCuotas ? CantidadCuotas : null;
        var monto = EsPlanCuotas && numeroCuota.HasValue
            ? ObtenerMontoParaCuota(numeroCuota.Value)
            : MontoCuota;

        return new GastoMensual(
            mes,
            anio,
            GastoMensual.TipoFijo,
            Categoria,
            Descripcion,
            monto,
            fecha,
            MedioPago,
            EstadoPagoGasto.Pendiente,
            observaciones,
            Id,
            numeroCuota,
            totalCuotas);
    }

    public bool PuedeGenerarEnMes(int mes, int anio)
    {
        if (!EstaActivo)
        {
            return false;
        }

        var objetivo = new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);
        if (objetivo < FechaInicio)
        {
            return false;
        }

        if (!EsPlanCuotas)
        {
            return true;
        }

        return CalcularNumeroCuotaPara(mes, anio).HasValue;
    }

    public int? CalcularNumeroCuotaPara(int mes, int anio)
    {
        if (!EsPlanCuotas || !FechaPrimeraCuota.HasValue || !CantidadCuotas.HasValue)
        {
            return null;
        }

        var fechaPrimera = new DateTime(FechaPrimeraCuota.Value.Year, FechaPrimeraCuota.Value.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var objetivo = new DateTime(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);

        var diferenciaMeses = ((objetivo.Year - fechaPrimera.Year) * 12) + (objetivo.Month - fechaPrimera.Month) + 1;
        if (diferenciaMeses < 1 || diferenciaMeses > CantidadCuotas.Value)
        {
            return null;
        }

        return diferenciaMeses;
    }

    public decimal ObtenerMontoParaCuota(int numeroCuota)
    {
        if (!EsPlanCuotas || !CantidadCuotas.HasValue)
        {
            return MontoCuota;
        }

        var total = CantidadCuotas.Value;
        if (numeroCuota >= total)
        {
            var montoPrevias = MontoCuota * (total - 1);
            var restante = MontoOriginal - montoPrevias;
            return Math.Round(restante, 2, MidpointRounding.AwayFromZero);
        }

        return MontoCuota;
    }

    public void ActualizarDatos(
        string categoria,
        string descripcion,
        decimal monto,
        int diaDeAplicacion,
        string medioPago,
        bool estaActivo,
        bool esPlanCuotas,
        DateTime? fechaPrimeraCuota,
        int? cantidadCuotas)
    {
        Categoria = categoria;
        Descripcion = descripcion;
        DiaDeAplicacion = diaDeAplicacion;
        MedioPago = medioPago;
        EstaActivo = estaActivo;
        ConfigurarMontos(monto, esPlanCuotas, fechaPrimeraCuota, cantidadCuotas);
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

    private void ConfigurarMontos(decimal montoOriginal, bool esPlanCuotas, DateTime? fechaPrimeraCuota, int? cantidadCuotas)
    {
        MontoOriginal = Math.Round(montoOriginal, 2, MidpointRounding.AwayFromZero);
        EsPlanCuotas = esPlanCuotas;

        if (!esPlanCuotas)
        {
            CantidadCuotas = null;
            FechaPrimeraCuota = null;
            MontoCuota = MontoOriginal;
            return;
        }

        if (!fechaPrimeraCuota.HasValue)
        {
            throw new ArgumentNullException(nameof(fechaPrimeraCuota));
        }

        if (!cantidadCuotas.HasValue || cantidadCuotas.Value <= 0)
        {
            throw new ArgumentException("cantidadCuotas debe ser mayor a 0", nameof(cantidadCuotas));
        }

        CantidadCuotas = cantidadCuotas.Value;
        FechaPrimeraCuota = DateTime.SpecifyKind(fechaPrimeraCuota.Value.Date, DateTimeKind.Utc);
        FechaInicio = FechaPrimeraCuota.Value;
        MontoCuota = Math.Round(MontoOriginal / CantidadCuotas.Value, 2, MidpointRounding.AwayFromZero);
    }
}
