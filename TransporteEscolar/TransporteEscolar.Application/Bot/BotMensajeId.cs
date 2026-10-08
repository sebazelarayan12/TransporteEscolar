using System.Security.Cryptography;
using System.Text;

namespace TransporteEscolar.Application.Bot;

/// <summary>
/// El id de mensaje de WhatsApp embebe el teléfono del remitente (p. ej. false_549...@c.us_...). Se guarda solo su
/// hash para que el dato personal no quede en la base; la idempotencia es idéntica porque el mismo id da el mismo hash.
/// </summary>
public static class BotMensajeId
{
    /// <summary>SHA-256 en hexadecimal minúscula (64 caracteres) del id recortado.</summary>
    public static string Hashear(string mensajeId)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(mensajeId.Trim()));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
