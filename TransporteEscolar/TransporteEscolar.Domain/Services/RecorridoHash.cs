using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Domain.Services;

/// <summary>
/// Huella de un par origen/destino. Permite detectar que un recorrido guardado quedó
/// obsoleto porque alguien movió un pin, sin tener que comparar coordenadas a mano.
/// </summary>
public static class RecorridoHash
{
    /// <summary>
    /// Seis decimales equivalen a unos 11 cm. Por debajo de esa precisión las diferencias
    /// son ruido de punto flotante y no deben disparar un recálculo.
    /// </summary>
    private const string FormatoCoordenada = "F6";

    private const int LargoHash = 16;

    /// <summary>Calcula la huella del par origen/destino.</summary>
    /// <param name="origen">Coordenada de partida (la casa del titular).</param>
    /// <param name="destino">Coordenada de llegada (el colegio).</param>
    /// <returns>16 caracteres hexadecimales en mayúsculas.</returns>
    /// <exception cref="ArgumentNullException">Si algún parámetro es null.</exception>
    public static string Calcular(Coordenada origen, Coordenada destino)
    {
        ArgumentNullException.ThrowIfNull(origen);
        ArgumentNullException.ThrowIfNull(destino);

        var crudo = string.Join('|',
            origen.Latitud.ToString(FormatoCoordenada, CultureInfo.InvariantCulture),
            origen.Longitud.ToString(FormatoCoordenada, CultureInfo.InvariantCulture),
            destino.Latitud.ToString(FormatoCoordenada, CultureInfo.InvariantCulture),
            destino.Longitud.ToString(FormatoCoordenada, CultureInfo.InvariantCulture));

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(crudo));
        return Convert.ToHexString(bytes)[..LargoHash];
    }
}
