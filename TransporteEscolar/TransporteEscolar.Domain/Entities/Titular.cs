namespace TransporteEscolar.Domain.Entities;

public class Titular
{
    public int Id { get; private set; }
    public string Apellido { get; private set; } = null!;
    public string NombreContacto { get; private set; } = null!;
    public string Direccion { get; private set; } = null!;
    public decimal MontoMensualPactado { get; private set; }
    public DateTime FechaAlta { get; private set; }
    public DateTime? FechaBaja { get; private set; }

    // Navegación
    public ICollection<TitularTelefono> Telefonos { get; private set; } = null!;

    // Constructor para EF Core
    private Titular() 
    { 
        Telefonos = new List<TitularTelefono>();
    }

    // Constructor para creación
    public Titular(
        string apellido,
        string nombreContacto,
        string direccion,
        decimal montoMensualPactado,
        DateTime? fechaAlta = null)
    {
        Apellido = NormalizarApellido(apellido);
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
        var referencia = fechaAlta ?? DateTime.UtcNow;
        FechaAlta = NormalizarFechaUtc(referencia);
        Telefonos = new List<TitularTelefono>();
    }

    // Métodos simples de actualización
    public void ActualizarDatos(string apellido, string nombreContacto, string direccion, decimal montoMensualPactado)
    {
        Apellido = NormalizarApellido(apellido);
        NombreContacto = nombreContacto;
        Direccion = direccion;
        MontoMensualPactado = montoMensualPactado;
    }

    public void ActualizarMontoMensual(decimal nuevoMonto)
    {
        if (nuevoMonto <= 0)
            throw new ArgumentOutOfRangeException(nameof(nuevoMonto), "El monto mensual pactado debe ser mayor a 0");

        MontoMensualPactado = nuevoMonto;
    }

    public IReadOnlyCollection<PagoMensual> RegistrarPago(
        decimal monto,
        DateTimeOffset fechaPago,
        string medioPago,
        string? observaciones,
        IReadOnlyCollection<PagoMensual> pagos)
    {
        if (monto <= 0)
            throw new ArgumentOutOfRangeException(nameof(monto), "El monto pagado debe ser mayor a 0");

        if (pagos == null || pagos.Count == 0)
            throw new InvalidOperationException("No hay pagos disponibles para registrar");

        var pagosPendientes = pagos
            .Where(p => p.SaldoPendiente() > 0)
            .OrderBy(p => p.Anio)
            .ThenBy(p => p.Mes)
            .ToList();

        if (pagosPendientes.Count == 0)
            throw new InvalidOperationException("No hay pagos pendientes para este titular");

        var pagosActualizados = new List<PagoMensual>();
        var montoRestante = monto;

        foreach (var pago in pagosPendientes)
        {
            if (montoRestante <= 0)
                break;

            var saldo = pago.SaldoPendiente();
            if (saldo <= 0)
                continue;

            var montoAplicar = Math.Min(montoRestante, saldo);
            pago.AplicarPago(montoAplicar, fechaPago, medioPago, observaciones);

            if (!pagosActualizados.Contains(pago))
            {
                pagosActualizados.Add(pago);
            }

            montoRestante -= montoAplicar;
        }

        if (montoRestante > 0)
        {
            throw new InvalidOperationException(
                $"El monto pagado ({monto:C}) excede la deuda total pendiente. Sobrante: {montoRestante:C}");
        }

        return pagosActualizados;
    }

    public TitularAjusteMontoResult AjustarMonto(
        decimal nuevoMonto,
        bool aplicarSoloPendientes,
        string? motivo,
        IReadOnlyCollection<PagoMensual> pagos)
    {
        if (pagos == null)
            throw new ArgumentNullException(nameof(pagos));

        var pagosObjetivo = aplicarSoloPendientes
            ? pagos.Where(p => !p.EstaPagado()).ToList()
            : pagos.ToList();

        var montoAnterior = MontoMensualPactado;

        foreach (var pago in pagosObjetivo)
        {
            if (nuevoMonto < pago.TotalPagado())
            {
                var periodo = $"{pago.Mes:D2}/{pago.Anio}";
                throw new InvalidOperationException(
                    $"El nuevo monto ({nuevoMonto:C}) no puede ser menor al total pagado ({pago.TotalPagado():C}) del período {periodo}.");
            }
        }

        ActualizarMontoMensual(nuevoMonto);

        var periodosActualizados = new List<string>();

        if (pagosObjetivo.Count == 0)
        {
            return new TitularAjusteMontoResult(montoAnterior, nuevoMonto, Array.Empty<PagoMensual>(), periodosActualizados);
        }

        var anotacion = string.IsNullOrWhiteSpace(motivo)
            ? null
            : $"Ajuste manual ${montoAnterior} -> ${nuevoMonto}. Motivo: {motivo}";

        foreach (var pago in pagosObjetivo)
        {
            pago.ActualizarMontoGenerado(nuevoMonto);

            if (!string.IsNullOrWhiteSpace(anotacion))
            {
                pago.AgregarAnotacion(anotacion);
            }

            periodosActualizados.Add($"{pago.Mes:D2}/{pago.Anio}");
        }

        return new TitularAjusteMontoResult(
            montoAnterior,
            nuevoMonto,
            pagosObjetivo,
            periodosActualizados);
    }

    public IReadOnlyCollection<PagoMensual> GenerarPagos(
        int titularId,
        int anio,
        int mesInicio,
        int mesFin,
        decimal monto,
        string observacionBase,
        IReadOnlyCollection<PagoMensual> pagosExistentes)
    {
        if (titularId != Id)
            throw new InvalidOperationException("El titular indicado no coincide");

        if (monto <= 0)
            throw new ArgumentOutOfRangeException(nameof(monto), "El monto generado debe ser mayor a 0");

        mesInicio = Math.Max(mesInicio, 3);
        mesFin = Math.Min(mesFin, 11);

        if (mesInicio > mesFin)
            return Array.Empty<PagoMensual>();

        var existentes = pagosExistentes
            .Where(p => p.Anio == anio)
            .Select(p => p.Mes)
            .ToHashSet();

        var nuevos = new List<PagoMensual>();

        for (var mes = mesInicio; mes <= mesFin; mes++)
        {
            if (existentes.Contains(mes))
                continue;

            var pago = new PagoMensual(
                titularId,
                mes,
                anio,
                monto,
                observacionBase);

            nuevos.Add(pago);
        }

        return nuevos;
    }

    public void DarDeBaja()
    {
        FechaBaja = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }

    private static DateTime NormalizarFechaUtc(DateTime valor)
    {
        var fechaUtc = valor.Kind switch
        {
            DateTimeKind.Utc => valor,
            DateTimeKind.Local => valor.ToUniversalTime(),
            _ => DateTime.SpecifyKind(valor, DateTimeKind.Utc)
        };

        return DateTime.SpecifyKind(fechaUtc.Date, DateTimeKind.Utc);
    }

    private static string NormalizarApellido(string valor)
    {
        return valor.Trim().ToUpperInvariant();
    }
}

public sealed record TitularAjusteMontoResult(
    decimal MontoAnterior,
    decimal MontoNuevo,
    IReadOnlyCollection<PagoMensual> PagosActualizados,
    IReadOnlyCollection<string> PeriodosActualizados);
