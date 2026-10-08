namespace TransporteEscolar.Application.DTOs;

/// <summary>Contratos del bot de WhatsApp para anotar gastos variables.</summary>
public static class BotGastoModel
{
    /// <summary>
    /// Pedido de alta de un gasto. Todo llega como texto y se valida de forma estricta.
    /// Los campos extra del JSON se ignoran.
    /// </summary>
    /// <param name="MensajeId">Id del mensaje de WhatsApp; da la idempotencia.</param>
    /// <param name="Monto">Decimal con punto y hasta 2 decimales, por ejemplo "4500.00".</param>
    /// <param name="Categoria">Una de las categorías permitidas (sin distinguir mayúsculas).</param>
    /// <param name="MedioPago">Efectivo, Transferencia o Tarjeta (sin distinguir mayúsculas).</param>
    /// <param name="Estado">Pagado o Pendiente (sin distinguir mayúsculas).</param>
    /// <param name="Fecha">Formato yyyy-MM-dd, día local de Argentina.</param>
    /// <param name="Descripcion">Entre 3 y 300 caracteres.</param>
    /// <param name="Vehiculo">Opcional; solo con categoría Combustible.</param>
    public sealed record RegistrarRequest(
        string? MensajeId,
        string? Monto,
        string? Categoria,
        string? MedioPago,
        string? Estado,
        string? Fecha,
        string? Descripcion,
        string? Vehiculo);

    /// <summary>Resultado del alta: el gasto y si se creó (true) o ya existía para ese mensaje (false).</summary>
    public sealed record RegistrarResultado(GastoModel.GastoMensualResponse Gasto, bool Creado);
}
