namespace TransporteEscolar.Api.Options;

/// <summary>
/// Cuenta compartida del administrador y modo de exigencia. Se configura por variables de entorno
/// (<c>Auth__Usuario</c>, <c>Auth__PasswordHash</c>, <c>Auth__Enforce</c>); nunca se commitea un valor real.
/// </summary>
public class AuthOptions
{
    public const string SectionName = "Auth";

    public string? Usuario { get; set; }

    /// <summary>Hash con formato <c>pbkdf2-sha256$iteraciones$sal$hash</c> (lo genera scripts/generar-credenciales-auth.mjs).</summary>
    public string? PasswordHash { get; set; }

    /// <summary>
    /// false = modo observación: nada se rechaza, solo se loguea "habría rechazado".
    /// true = se exige autenticación en toda la API. Por defecto false.
    /// </summary>
    public bool Enforce { get; set; }
}
