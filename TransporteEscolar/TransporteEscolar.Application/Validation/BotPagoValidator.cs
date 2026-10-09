using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

/// <summary>
/// Valida y normaliza de forma estricta los pedidos de simulación y registro de pagos que manda el bot (todo llega como texto).
/// Reutiliza las reglas de monto, fecha, lista y mensajeId de <see cref="BotGastoValidator"/>.
/// </summary>
public static class BotPagoValidator
{
    private static readonly string[] MediosPago = { "Efectivo", "Transferencia", "Tarjeta" };

    /// <summary>Datos del pago ya validados y con la grafía canónica.</summary>
    public sealed record Datos(
        string MensajeId,
        int TitularId,
        decimal Monto,
        string MedioPago,
        DateOnly Fecha);

    /// <summary>Valida un pedido de simulación. Devuelve el titular y el monto normalizados.</summary>
    public static (int TitularId, decimal Monto) ValidarSimulacion(BotPagoModel.SimularRequest request)
    {
        var titularId = ValidarTitularId(request.TitularId);
        var monto = BotGastoValidator.ValidarMonto(request.Monto);

        return (titularId, monto);
    }

    /// <summary>Valida un pedido de registro de pago. Devuelve los datos normalizados.</summary>
    public static Datos ValidarRegistro(BotPagoModel.RegistrarRequest request, DateOnly hoyArgentina)
    {
        var mensajeId = BotGastoValidator.ValidarMensajeId(request.MensajeId);
        var titularId = ValidarTitularId(request.TitularId);
        var monto = BotGastoValidator.ValidarMonto(request.Monto);
        var medioPago = BotGastoValidator.ValidarLista(request.MedioPago, "medioPago", MediosPago);
        var fecha = BotGastoValidator.ValidarFecha(request.Fecha, hoyArgentina);

        return new Datos(mensajeId, titularId, monto, medioPago, fecha);
    }

    private static int ValidarTitularId(int? titularId)
    {
        if (titularId is null)
            throw new ValidationException("titularId es requerido.");

        if (titularId <= 0)
            throw new ValidationException("titularId inválido.");

        return titularId.Value;
    }
}
