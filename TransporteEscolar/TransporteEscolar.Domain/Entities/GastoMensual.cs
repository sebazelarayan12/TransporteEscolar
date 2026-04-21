using TransporteEscolar.Domain.Enums;

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
    public EstadoPagoGasto EstadoPago { get; private set; } = EstadoPagoGasto.Pendiente;
    public DateTime? FechaActualizacion { get; private set; }
    public int? NumeroCuota { get; private set; }
    public int? TotalCuotas { get; private set; }
    public string? Observaciones { get; private set; }
    public string? Vehiculo { get; private set; }
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
        EstadoPagoGasto estadoPago = EstadoPagoGasto.Pendiente,
        string? observaciones = null,
        int? gastoFijoTemplateId = null,
        int? numeroCuota = null,
        int? totalCuotas = null,
        string? vehiculo = null)
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
        Vehiculo = vehiculo;
        GastoFijoTemplateId = gastoFijoTemplateId;
        NumeroCuota = numeroCuota;
        TotalCuotas = totalCuotas;
    }

    public void ActualizarDesdeTemplate(GastoFijoTemplate template, string? observaciones)
    {
        Categoria = template.Categoria;
        Descripcion = template.Descripcion;
        MedioPago = template.MedioPago;
        Observaciones = observaciones;
        Fecha = CrearFechaNormalizada(template.DiaDeAplicacion);

        if (template.EsPlanCuotas && template.CantidadCuotas.HasValue)
        {
            TotalCuotas = template.CantidadCuotas;

            if (!NumeroCuota.HasValue)
            {
                var numeroCalculado = template.CalcularNumeroCuotaPara(Mes, Anio);
                if (numeroCalculado.HasValue)
                {
                    NumeroCuota = numeroCalculado;
                }
            }

            var numero = NumeroCuota ?? template.CantidadCuotas.Value;
            Monto = template.ObtenerMontoParaCuota(numero);
        }
        else
        {
            NumeroCuota = null;
            TotalCuotas = null;
            Monto = template.MontoCuota;
        }
    }

    public void AsignarCuota(int numeroCuota, int totalCuotas)
    {
        NumeroCuota = numeroCuota;
        TotalCuotas = totalCuotas;
    }

    public void MarcarComoPagado(DateTime fechaActualizacion)
    {
        if (EstadoPago == EstadoPagoGasto.Pagado)
        {
            return;
        }

        EstadoPago = EstadoPagoGasto.Pagado;
        FechaActualizacion = DateTime.SpecifyKind(fechaActualizacion, DateTimeKind.Utc);
    }

    private DateTime CrearFechaNormalizada(int diaDeAplicacion)
    {
        var diasDelMes = DateTime.DaysInMonth(Anio, Mes);
        var dia = Math.Clamp(diaDeAplicacion, 1, diasDelMes);
        return new DateTime(Anio, Mes, dia, 0, 0, 0, DateTimeKind.Utc);
    }
}
