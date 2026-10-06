using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace TransporteEscolar.Api.Authentication;

/// <summary>
/// Autentica clientes máquina-a-máquina con el header <c>X-Api-Key</c> y les asigna sus alcances como
/// claims <c>scope</c>.
/// <para>
/// IMPORTANTE: este manejador NUNCA lanza excepciones. <c>GlobalExceptionHandlerMiddleware</c> convierte
/// cualquier excepción no mapeada en 500 y no conoce 401 ni 503.
/// </para>
/// <para>
/// Códigos: sin ningún cliente configurado → 503 (falla cerrado, aunque venga header); header ausente, vacío o
/// repetido → 401; clave desconocida → 401. El 403 (falta el alcance) lo produce la política de autorización.
/// </para>
/// </summary>
public class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "ApiKey";
    public const string HeaderName = "X-Api-Key";
    public const string ScopeClaim = "scope";

    private readonly ApiClientCatalog _catalogo;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ApiClientCatalog catalogo)
        : base(options, logger, encoder)
    {
        _catalogo = catalogo;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // 1) Config primero (fail closed): sin clientes configurados no se autentica a nadie.
        if (!_catalogo.HayClientes)
        {
            Logger.LogWarning("No hay ninguna API key configurada (BotApi:ApiKey / ApiClients); se rechaza con 503");
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        // 2) Header ausente, vacío o repetido → sin credenciales (401 en el challenge).
        var valores = Request.Headers[HeaderName];
        if (valores.Count != 1 || string.IsNullOrEmpty(valores[0]))
            return Task.FromResult(AuthenticateResult.NoResult());

        // 3) Clave desconocida → falla (401 en el challenge).
        var cliente = _catalogo.Resolver(valores[0]!);
        if (cliente is null)
            return Task.FromResult(AuthenticateResult.Fail("API key inválida"));

        // 4) Cliente conocido: nombre + un claim "scope" por alcance.
        var claims = new List<Claim> { new(ClaimTypes.Name, cliente.Name) };
        claims.AddRange(cliente.Scopes.Select(s => new Claim(ScopeClaim, s)));

        var identidad = new ClaimsIdentity(claims, SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identidad), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = _catalogo.HayClientes
            ? StatusCodes.Status401Unauthorized
            : StatusCodes.Status503ServiceUnavailable;
        return Task.CompletedTask;
    }
}
