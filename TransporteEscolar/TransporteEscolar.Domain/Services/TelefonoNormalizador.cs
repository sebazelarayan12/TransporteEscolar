namespace TransporteEscolar.Domain.Services;

/// <summary>
/// Lleva cualquier formato de teléfono argentino a una forma canónica comparable:
/// el número nacional de 10 dígitos (código de área + abonado). Permite cruzar el número
/// que manda WhatsApp (54 + 9 + área + abonado) con el que está guardado en la base,
/// que puede traer símbolos, con o sin 54 y casi siempre sin el 9 móvil.
/// </summary>
public static class TelefonoNormalizador
{
    private const int LargoNacional = 10;
    private const int LargoNacionalConNueve = 11;
    private const int CantidadDigitosMostrados = 4;

    /// <summary>Devuelve el número nacional de 10 dígitos (área + abonado) o null si no se puede normalizar.</summary>
    /// <param name="entrada">Teléfono en cualquier formato (con +, espacios, guiones, paréntesis, 54, 9, 0...).</param>
    /// <returns>
    /// Exactamente 10 dígitos, o null si no queda un número de esa longitud. No se toman
    /// "los últimos 10 dígitos": un número que sobra o falta dígitos no es comparable y daría falsos matches.
    /// </returns>
    public static string? ANacional(string? entrada)
    {
        if (string.IsNullOrWhiteSpace(entrada))
            return null;

        var digitos = SoloDigitos(entrada);
        if (digitos.Length == 0)
            return null;

        // Prefijo internacional de marcación (00).
        if (digitos.StartsWith("00", StringComparison.Ordinal))
            digitos = digitos[2..];

        // Código de país. Solo se quita si sobran dígitos; un área que empiece con 54 no se toca.
        if (digitos.StartsWith("54", StringComparison.Ordinal) && digitos.Length > LargoNacional)
            digitos = digitos[2..];

        // Prefijo de móvil (9): con él el número nacional tiene 11 dígitos.
        if (digitos.Length == LargoNacionalConNueve && digitos[0] == '9')
            digitos = digitos[1..];

        // Prefijo de marcación nacional (0).
        if (digitos.StartsWith('0'))
            digitos = digitos[1..];

        return digitos.Length == LargoNacional ? digitos : null;
    }

    /// <summary>
    /// Enmascara un número canónico para poder registrarlo en logs sin exponerlo completo.
    /// </summary>
    /// <param name="canonico">Número canónico (idealmente el resultado de <see cref="ANacional"/>).</param>
    /// <returns>Los últimos 4 dígitos precedidos de puntos suspensivos (por ejemplo, …3456); "…" si no hay dígitos.</returns>
    public static string UltimosCuatro(string? canonico)
    {
        if (string.IsNullOrEmpty(canonico))
            return "…";

        var cola = canonico.Length <= CantidadDigitosMostrados
            ? canonico
            : canonico[^CantidadDigitosMostrados..];

        return $"…{cola}";
    }

    private static string SoloDigitos(string entrada)
    {
        return string.Concat(entrada.Where(char.IsAsciiDigit));
    }
}
