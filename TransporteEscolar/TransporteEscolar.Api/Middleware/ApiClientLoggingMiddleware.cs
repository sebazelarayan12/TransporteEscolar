using Microsoft.AspNetCore.Authentication;
using TransporteEscolar.Api.Authentication;

namespace TransporteEscolar.Api.Middleware;

/// <summary>
/// Registra cada pedido de la API con el cliente identificado: el nombre del cliente ApiKey, "clave-invalida"
/// si mandó un X-Api-Key desconocido, o "anonimo" si no mandó credenciales. Sirve para ver, antes de exigir
/// autenticación global (Fase 2), quién llama a qué sin credenciales.
/// <para>
/// Solo registra método, <c>Request.Path</c> y status: NUNCA el query string (el teléfono viaja en
/// <c>?numero=</c>) ni la clave. Omite <c>/health</c>. No lanza excepciones por sí mismo.
/// </para>
/// </summary>
public class ApiClientLoggingMiddleware
{
    public const string ClienteAnonimo = "anonimo";
    public const string ClienteClaveInvalida = "clave-invalida";

    private readonly RequestDelegate _next;
    private readonly ILogger<ApiClientLoggingMiddleware> _logger;

    public ApiClientLoggingMiddleware(RequestDelegate next, ILogger<ApiClientLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var cliente = await IdentificarClienteAsync(context);

        await _next(context);

        if (context.Request.Path.StartsWithSegments("/health"))
            return;

        _logger.LogInformation(
            "Pedido {Metodo} {Ruta} cliente={Cliente} status={Status}",
            context.Request.Method,
            context.Request.Path.Value,
            cliente,
            context.Response.StatusCode);
    }

    private static async Task<string> IdentificarClienteAsync(HttpContext context)
    {
        // Solo se intenta autenticar si el pedido trae el header; el resto es anónimo sin costo extra.
        if (!context.Request.Headers.ContainsKey(ApiKeyAuthenticationHandler.HeaderName))
            return ClienteAnonimo;

        var resultado = await context.AuthenticateAsync(ApiKeyAuthenticationHandler.SchemeName);
        return resultado.Succeeded
            ? resultado.Principal?.Identity?.Name ?? ClienteAnonimo
            : ClienteClaveInvalida;
    }
}
