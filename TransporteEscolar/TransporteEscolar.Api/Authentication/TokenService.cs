using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Api.Authentication;

/// <summary>Emite y describe cómo validar los JWT de las personas (HS256).</summary>
public sealed class TokenService
{
    public const string ClaimTipo = "tipo";
    public const string TipoPersona = "persona";
    private const int LargoMinimoSecreto = 32;

    private readonly JwtOptions _opciones;
    private readonly SymmetricSecurityKey? _clave;

    public TokenService(IOptions<JwtOptions> opciones)
    {
        _opciones = opciones.Value;
        var secreto = _opciones.Secret;
        _clave = !string.IsNullOrEmpty(secreto) && Encoding.UTF8.GetByteCount(secreto) >= LargoMinimoSecreto
            ? new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secreto))
            : null;
    }

    /// <summary>Falso = el secreto falta o es demasiado corto: no se puede emitir ni validar (503 en el login).</summary>
    public bool Configurado => _clave is not null;

    public (string Token, DateTime ExpiraEnUtc) Emitir(string usuario)
    {
        if (_clave is null)
            throw new InvalidOperationException("Jwt:Secret no está configurado (mínimo 32 bytes).");

        var ahora = DateTime.UtcNow;
        var expira = ahora.AddDays(Math.Max(1, _opciones.DiasValidez));
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario),
            new Claim(ClaimTipo, TipoPersona),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        var token = new JwtSecurityToken(
            issuer: JwtOptions.Issuer,
            audience: JwtOptions.Audience,
            claims: claims,
            notBefore: ahora,
            expires: expira,
            signingCredentials: new SigningCredentials(_clave, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expira);
    }

    /// <summary>
    /// Parámetros de validación para JwtBearer. Sin secreto válido se usa una clave aleatoria por proceso:
    /// ningún token valida y no se lanzan excepciones al arrancar.
    /// </summary>
    public TokenValidationParameters ParametrosDeValidacion() => new()
    {
        ValidateIssuer = true,
        ValidIssuer = JwtOptions.Issuer,
        ValidateAudience = true,
        ValidAudience = JwtOptions.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = _clave ?? new SymmetricSecurityKey(System.Security.Cryptography.RandomNumberGenerator.GetBytes(LargoMinimoSecreto)),
        ValidateLifetime = true,
        RequireExpirationTime = true,
        ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
        ClockSkew = TimeSpan.FromMinutes(1)
    };
}
