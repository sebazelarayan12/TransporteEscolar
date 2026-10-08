using System.Globalization;
using System.Text.RegularExpressions;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

/// <summary>
/// Valida y normaliza de forma estricta el pedido de alta de gasto que manda el bot (todo llega como texto).
/// </summary>
public static class BotGastoValidator
{
    public const decimal TopeMonto = 10_000_000m;

    private const int MaxMensajeId = 200;
    private const int MinDescripcion = 3;
    private const int MaxDescripcion = 300;
    private const string CategoriaCombustible = "Combustible";

    private static readonly string[] Categorias =
    {
        "Combustible", "Mantenimiento", "Alimentacion", "ViajesEventos", "Tarjeta", "ServiciosPublicos", "Otros"
    };

    private static readonly string[] MediosPago = { "Efectivo", "Transferencia", "Tarjeta" };
    private static readonly string[] Estados = { "Pagado", "Pendiente" };

    // [0-9] y \z (no \d ni $): \d acepta dígitos de otros alfabetos y $ acepta un salto de línea final.
    private static readonly Regex MontoRegex = new(
        @"^[0-9]{1,10}(\.[0-9]{1,2})?\z",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>Datos del gasto ya validados y con la grafía canónica.</summary>
    public sealed record Datos(
        string MensajeId,
        decimal Monto,
        string Categoria,
        string MedioPago,
        string EstadoPago,
        DateOnly Fecha,
        string Descripcion,
        string? Vehiculo);

    public static Datos Validar(BotGastoModel.RegistrarRequest request, DateOnly hoyArgentina)
    {
        var mensajeId = ValidarMensajeId(request.MensajeId);
        var monto = ValidarMonto(request.Monto);
        var categoria = ValidarLista(request.Categoria, "categoria", Categorias, "válida");
        var medioPago = ValidarLista(request.MedioPago, "medioPago", MediosPago);
        var estado = ValidarLista(request.Estado, "estado", Estados);
        var fecha = ValidarFecha(request.Fecha, hoyArgentina);
        var descripcion = ValidarDescripcion(request.Descripcion);

        if (request.Vehiculo is not null && categoria != CategoriaCombustible)
            throw new ValidationException("vehiculo solo se acepta con la categoria Combustible.");

        var vehiculo = GastoValidator.NormalizarVehiculo(request.Vehiculo);

        // Reutiliza las reglas compartidas con la carga desde la app (largos, estado, vehículo).
        GastoValidator.ValidateGastoVariable(new GastoModel.GastoVariableRequest(
            fecha.Month,
            fecha.Year,
            categoria,
            descripcion,
            monto,
            fecha,
            medioPago,
            estado,
            null,
            vehiculo));

        return new Datos(mensajeId, monto, categoria, medioPago, estado, fecha, descripcion, vehiculo);
    }

    private static string ValidarMensajeId(string? valor)
    {
        var mensajeId = valor?.Trim();

        if (string.IsNullOrEmpty(mensajeId))
            throw new ValidationException("mensajeId es requerido.");

        if (mensajeId.Length > MaxMensajeId)
            throw new ValidationException($"mensajeId supera el máximo de {MaxMensajeId} caracteres.");

        return mensajeId;
    }

    // Estricto: no se recorta. " 4500 " es inválido (el bot manda el valor ya limpio).
    private static decimal ValidarMonto(string? valor)
    {
        if (valor is null || valor.Length == 0)
            throw new ValidationException("monto es requerido.");

        if (!MontoRegex.IsMatch(valor))
            throw new ValidationException("monto inválido: usá punto decimal y hasta 2 decimales.");

        var monto = decimal.Parse(valor, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture);

        if (monto <= 0)
            throw new ValidationException("monto debe ser mayor a 0.");

        if (monto > TopeMonto)
            throw new ValidationException($"monto supera el máximo permitido ({TopeMonto:0}).");

        return monto;
    }

    private static string ValidarLista(string? valor, string campo, string[] permitidos, string adjetivo = "válido")
    {
        var texto = valor?.Trim();

        if (string.IsNullOrEmpty(texto))
            throw new ValidationException($"{campo} es requerido.");

        var canonico = permitidos.FirstOrDefault(p => string.Equals(p, texto, StringComparison.OrdinalIgnoreCase));

        return canonico
            ?? throw new ValidationException($"{campo} no {adjetivo}. Opciones: {string.Join(", ", permitidos)}.");
    }

    private static DateOnly ValidarFecha(string? valor, DateOnly hoyArgentina)
    {
        if (string.IsNullOrEmpty(valor))
            throw new ValidationException("fecha es requerida.");

        if (!DateOnly.TryParseExact(valor, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha))
            throw new ValidationException("fecha inválida: usá el formato yyyy-MM-dd.");

        if (fecha > hoyArgentina)
            throw new ValidationException("fecha no puede ser posterior a hoy.");

        return fecha;
    }

    private static string ValidarDescripcion(string? valor)
    {
        var descripcion = valor?.Trim();

        if (string.IsNullOrEmpty(descripcion))
            throw new ValidationException("descripcion es requerida.");

        if (descripcion.Length < MinDescripcion || descripcion.Length > MaxDescripcion)
            throw new ValidationException($"descripcion debe tener entre {MinDescripcion} y {MaxDescripcion} caracteres.");

        return descripcion;
    }
}
