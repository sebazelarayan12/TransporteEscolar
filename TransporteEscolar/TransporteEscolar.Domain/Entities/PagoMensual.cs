namespace TransporteEscolar.Domain.Entities;

public class PagoMensual
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public int Mes { get; private set; } // 1-12
    public int Anio { get; private set; }
    public decimal MontoGenerado { get; private set; }
    public DateTime FechaVencimiento { get; private set; }
    public string? Observaciones { get; private set; }
    public string? MercadoPagoPreferenceId { get; private set; }
    public string? MercadoPagoUrl { get; private set; }
    public string? MercadoPagoPaymentId { get; private set; }
    public DateTime? MercadoPagoGeneratedAt { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;
    public ICollection<PagoMovimiento> Movimientos { get; private set; } = null!;

    // Constructor para EF Core
    private PagoMensual() 
    {
        Movimientos = new List<PagoMovimiento>();
    }

    // Constructor para creación
    public PagoMensual(
        int titularId,
        int mes,
        int anio,
        decimal montoGenerado,
        string? observaciones = null)
    {
        TitularId = titularId;
        Mes = mes;
        Anio = anio;
        MontoGenerado = montoGenerado;
        FechaVencimiento = CrearFechaVencimiento(anio, mes);
        Observaciones = observaciones;
        Movimientos = new List<PagoMovimiento>();
    }

    public decimal TotalPagado()
    {
        return Movimientos.Sum(m => m.Monto);
    }

    public bool EstaPagado()
    {
        return TotalPagado() >= MontoGenerado;
    }

    public bool EstaVencido()
    {
        var hoy = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        return hoy > FechaVencimiento.Date && !EstaPagado();
    }

    public decimal SaldoPendiente()
    {
        var saldo = MontoGenerado - TotalPagado();
        return saldo > 0 ? saldo : 0;
    }

    public void ActualizarObservaciones(string? observaciones)
    {
        Observaciones = observaciones;
    }

    public void ActualizarMontoGenerado(decimal nuevoMonto)
    {
        if (nuevoMonto <= 0)
            throw new ArgumentOutOfRangeException(nameof(nuevoMonto), "El monto generado debe ser mayor a 0");

        if (nuevoMonto < TotalPagado())
            throw new InvalidOperationException("El nuevo monto no puede ser menor al total pagado");

        MontoGenerado = nuevoMonto;
        InvalidarMercadoPagoLink();
    }

    public void AgregarAnotacion(string anotacion)
    {
        if (string.IsNullOrWhiteSpace(anotacion))
            return;

        Observaciones = string.IsNullOrWhiteSpace(Observaciones)
            ? anotacion
            : $"{Observaciones} | {anotacion}";
    }

    public PagoMovimiento AplicarPago(
        decimal monto,
        DateTimeOffset fechaPago,
        string medioPago,
        string? observaciones)
    {
        if (monto <= 0)
            throw new ArgumentOutOfRangeException(nameof(monto), "El monto aplicado debe ser mayor a 0");

        var saldoPendiente = SaldoPendiente();
        if (saldoPendiente <= 0)
            throw new InvalidOperationException("El pago mensual no tiene saldo pendiente");

        if (monto > saldoPendiente)
            throw new InvalidOperationException("El monto aplicado excede el saldo pendiente");

        var observacionAplicada = monto < saldoPendiente
            ? string.IsNullOrWhiteSpace(observaciones)
                ? "Pago parcial"
                : $"{observaciones} (Pago parcial)"
            : observaciones;

        var movimiento = new PagoMovimiento(
            Id,
            monto,
            fechaPago,
            medioPago,
            observacionAplicada);

        Movimientos.Add(movimiento);
        return movimiento;
    }

    public void AsignarMercadoPagoLink(string preferenceId, string url, DateTime generatedAtUtc)
    {
        if (string.IsNullOrWhiteSpace(preferenceId))
            throw new ArgumentException("El identificador de Mercado Pago es obligatorio", nameof(preferenceId));

        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("La url de Mercado Pago es obligatoria", nameof(url));

        MercadoPagoPreferenceId = preferenceId;
        MercadoPagoUrl = url;
        MercadoPagoGeneratedAt = DateTime.SpecifyKind(generatedAtUtc, DateTimeKind.Utc);
    }

    public void LimpiarMercadoPagoPayment()
    {
        MercadoPagoPaymentId = null;
    }

    public void RegistrarMercadoPagoPayment(string paymentId)
    {
        if (string.IsNullOrWhiteSpace(paymentId))
            throw new ArgumentException("El identificador del pago confirmado es obligatorio", nameof(paymentId));

        MercadoPagoPaymentId = paymentId;
    }

    public void InvalidarMercadoPagoLink()
    {
        MercadoPagoPreferenceId = null;
        MercadoPagoUrl = null;
        MercadoPagoGeneratedAt = null;
    }

    public PagoMovimiento EliminarMovimiento(int movimientoId)
    {
        var movimiento = Movimientos.FirstOrDefault(m => m.Id == movimientoId);
        if (movimiento == null)
            throw new InvalidOperationException("El movimiento indicado no pertenece al pago mensual");

        var nuevoTotal = TotalPagado() - movimiento.Monto;
        if (nuevoTotal < 0)
            throw new InvalidOperationException("Eliminar el movimiento genera un total negativo");

        Movimientos.Remove(movimiento);
        return movimiento;
    }

    private static DateTime CrearFechaVencimiento(int anio, int mes)
    {
        return new DateTime(anio, mes, 10, 0, 0, 0, DateTimeKind.Utc);
    }
}
