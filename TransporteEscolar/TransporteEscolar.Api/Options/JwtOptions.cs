namespace TransporteEscolar.Api.Options;

/// <summary>Configuración del JWT. El secreto viene de <c>Jwt__Secret</c> (mínimo 32 bytes UTF-8).</summary>
public class JwtOptions
{
    public const string SectionName = "Jwt";
    public const string Issuer = "TransporteEscolar";
    public const string Audience = "TransporteEscolar";

    public string? Secret { get; set; }

    /// <summary>Días de validez del token. Por defecto 30.</summary>
    public int DiasValidez { get; set; } = 30;
}
