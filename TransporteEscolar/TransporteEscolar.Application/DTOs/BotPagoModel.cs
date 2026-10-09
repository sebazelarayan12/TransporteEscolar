namespace TransporteEscolar.Application.DTOs;

/// <summary>
/// Contratos del bot de WhatsApp para registrar pagos de cuotas.
/// Ninguna respuesta expone dirección, teléfono ni monto pactado del titular.
/// </summary>
public static class BotPagoModel
{
    /// <summary>
    /// Pedido de simulación de reparto. No escribe nada.
    /// Todo llega como texto y se valida de forma estricta. Los campos extra del JSON se ignoran.
    /// </summary>
    /// <param name="TitularId">Titular al que se le simula el pago.</param>
    /// <param name="Monto">Decimal con punto y hasta 2 decimales, por ejemplo "150000.00".</param>
    public sealed record SimularRequest(int? TitularId, string? Monto);

    /// <summary>
    /// Pedido de alta de un pago. Todo llega como texto y se valida de forma estricta.
    /// Los campos extra del JSON se ignoran (por ejemplo, quién cargó el pago: nunca se guarda).
    /// </summary>
    /// <param name="MensajeId">Id del mensaje de WhatsApp; da la idempotencia.</param>
    /// <param name="TitularId">Titular que paga.</param>
    /// <param name="Monto">Decimal con punto y hasta 2 decimales, por ejemplo "150000.00".</param>
    /// <param name="MedioPago">Efectivo, Transferencia o Tarjeta (sin distinguir mayúsculas).</param>
    /// <param name="Fecha">Formato yyyy-MM-dd, día local de Argentina.</param>
    public sealed record RegistrarRequest(
        string? MensajeId,
        int? TitularId,
        string? Monto,
        string? MedioPago,
        string? Fecha);

    /// <summary>Titular activo que puede pagar, con los nombres de pila de sus pasajeros activos.</summary>
    /// <param name="TitularId">Identificador del titular.</param>
    /// <param name="Apellido">Apellido del titular.</param>
    /// <param name="NombreContacto">Nombre de la persona de contacto.</param>
    /// <param name="Pasajeros">Nombres de pila de los pasajeros activos, ordenados.</param>
    public sealed record TitularItem(
        int TitularId,
        string Apellido,
        string NombreContacto,
        List<string> Pasajeros);

    /// <summary>Cuota con saldo pendiente de un titular.</summary>
    /// <param name="Anio">Año de la cuota.</param>
    /// <param name="Mes">Mes de la cuota (1-12).</param>
    /// <param name="MontoGenerado">Monto de la cuota.</param>
    /// <param name="SaldoPendiente">Lo que falta pagar de la cuota (mayor a 0).</param>
    public sealed record CuotaItem(int Anio, int Mes, decimal MontoGenerado, decimal SaldoPendiente);

    /// <summary>Cuotas con saldo pendiente de un titular, ordenadas por año y mes ascendente.</summary>
    /// <param name="TitularId">Identificador del titular.</param>
    /// <param name="Apellido">Apellido del titular.</param>
    /// <param name="Cuotas">Cuotas con saldo mayor a 0.</param>
    public sealed record CuotasResponse(int TitularId, string Apellido, List<CuotaItem> Cuotas);

    /// <summary>Parte del monto que se aplicaría a una cuota en la simulación.</summary>
    /// <param name="Anio">Año de la cuota.</param>
    /// <param name="Mes">Mes de la cuota.</param>
    /// <param name="Aplicado">Monto que cubriría esta cuota.</param>
    /// <param name="SaldoRestante">Saldo de la cuota después de aplicar el monto.</param>
    public sealed record RepartoItem(int Anio, int Mes, decimal Aplicado, decimal SaldoRestante);

    /// <summary>Resultado de simular un pago. No se guardó nada.</summary>
    /// <param name="TitularId">Identificador del titular.</param>
    /// <param name="Apellido">Apellido del titular.</param>
    /// <param name="Monto">Monto simulado.</param>
    /// <param name="Reparto">Cómo se repartiría el monto entre las cuotas.</param>
    public sealed record SimulacionResponse(
        int TitularId,
        string Apellido,
        decimal Monto,
        List<RepartoItem> Reparto);

    /// <summary>Movimiento creado (o ya existente) para una cuota dentro de un pago del bot.</summary>
    /// <param name="Id">Identificador del movimiento.</param>
    /// <param name="Anio">Año de la cuota.</param>
    /// <param name="Mes">Mes de la cuota.</param>
    /// <param name="Aplicado">Monto aplicado a la cuota por este pago.</param>
    /// <param name="SaldoRestante">Saldo actual de la cuota.</param>
    public sealed record MovimientoItem(int Id, int Anio, int Mes, decimal Aplicado, decimal SaldoRestante);

    /// <summary>Pago registrado por el bot con los movimientos que generó.</summary>
    /// <param name="GrupoId">Identificador del grupo de movimientos de este pago.</param>
    /// <param name="TitularId">Identificador del titular.</param>
    /// <param name="Monto">Monto total del pago.</param>
    /// <param name="Movimientos">Un movimiento por cuota cubierta.</param>
    public sealed record PagoResponse(
        Guid GrupoId,
        int TitularId,
        decimal Monto,
        List<MovimientoItem> Movimientos);

    /// <summary>Resultado del alta: el pago y si se creó (true) o ya existía para ese mensaje (false).</summary>
    public sealed record RegistrarResultado(PagoResponse Pago, bool Creado);
}
