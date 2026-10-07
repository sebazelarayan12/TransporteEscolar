using System.Security.Cryptography;
using System.Text;

namespace TransporteEscolar.Api.Authentication;

/// <summary>
/// Hash de contraseñas con PBKDF2-SHA256. Formato: <c>pbkdf2-sha256$iteraciones$salBase64$hashBase64</c>.
/// Verificar NUNCA lanza excepciones: un hash mal formado simplemente no coincide.
/// </summary>
public static class PasswordHasher
{
    public const string Prefijo = "pbkdf2-sha256";
    public const int IteracionesPorDefecto = 600_000;
    private const int LargoSal = 16;
    private const int LargoHash = 32;

    public static string Hashear(string password, int iteraciones = IteracionesPorDefecto)
    {
        var sal = RandomNumberGenerator.GetBytes(LargoSal);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), sal, iteraciones, HashAlgorithmName.SHA256, LargoHash);
        return $"{Prefijo}${iteraciones}${Convert.ToBase64String(sal)}${Convert.ToBase64String(hash)}";
    }

    public static bool Verificar(string password, string? hashGuardado)
    {
        if (string.IsNullOrWhiteSpace(hashGuardado))
            return false;

        var partes = hashGuardado.Split('$');
        if (partes.Length != 4 || partes[0] != Prefijo || !int.TryParse(partes[1], out var iteraciones) || iteraciones < 1)
            return false;

        byte[] sal, esperado;
        try
        {
            sal = Convert.FromBase64String(partes[2]);
            esperado = Convert.FromBase64String(partes[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        if (sal.Length == 0 || esperado.Length == 0)
            return false;

        var calculado = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), sal, iteraciones, HashAlgorithmName.SHA256, esperado.Length);
        return CryptographicOperations.FixedTimeEquals(calculado, esperado);
    }
}
