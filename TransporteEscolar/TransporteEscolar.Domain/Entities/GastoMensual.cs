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

    /// <summary>Plazo (en horas) durante el cual el bot puede anular un gasto que cargó.</summary>
    public const int HorasParaAnularPorBot = 24;

    /// <summary>Id del mensaje de WhatsApp que originó el gasto. Null si no lo cargó el bot.</summary>
    public string? OrigenMensajeId { get; private set; }

    /// <summary>Momento de creación (UTC). Solo se completa en los gastos cargados por el bot.</summary>
    public DateTime? FechaCreacion { get; private set; }

    public bool EsDeBot => OrigenMensajeId is not null;

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

    public void MarcarComoCargadoPorBot(string mensajeId, DateTime ahoraUtc)
    {
        if (string.IsNullOrWhiteSpace(mensajeId))
        {
            throw new ArgumentException("El id del mensaje de origen es obligatorio.", nameof(mensajeId));
        }

        OrigenMensajeId = mensajeId;
        FechaCreacion = DateTime.SpecifyKind(ahoraUtc, DateTimeKind.Utc);
    }

    public bool DentroDelPlazoDeAnulacion(DateTime ahoraUtc)
    {
        return FechaCreacion.HasValue
            && ahoraUtc - FechaCreacion.Value < TimeSpan.FromHours(HorasParaAnularPorBot);
    }

    private DateTime CrearFechaNormalizada(int diaDeAplicacion)
    {
        var diasDelMes = DateTime.DaysInMonth(Anio, Mes);
        var dia = Math.Clamp(diaDeAplicacion, 1, diasDelMes);
        return new DateTime(Anio, Mes, dia, 0, 0, 0, DateTimeKind.Utc);
    }
}
