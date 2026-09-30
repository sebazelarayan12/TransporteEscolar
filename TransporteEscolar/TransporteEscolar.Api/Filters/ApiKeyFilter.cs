using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Api.Filters;

/// <summary>
/// Protege una ruta con la clave del header <c>X-Api-Key</c>. Se aplica solo con
/// <c>[ServiceFilter]</c> sobre el controller del bot: no es global.
/// <para>
/// IMPORTANTE: este filtro NUNCA lanza excepciones. <c>GlobalExceptionHandlerMiddleware</c> convierte
/// cualquier excepción no mapeada en 500 y no conoce 401 ni 503, así que se corta el pipeline
/// asignando <see cref="AuthorizationFilterContext.Result"/>.
/// </para>
/// </summary>
public class ApiKeyFilter : IAuthorizationFilter
{
    public const string HeaderName = "X-Api-Key";

    private readonly BotApiOptions _options;
    private readonly ILogger<ApiKeyFilter> _logger;

    public ApiKeyFilter(IOptions<BotApiOptions> options, ILogger<ApiKeyFilter> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // 1) Config primero (fail closed): sin clave configurada el endpoint no se abre nunca,
        //    aunque el request traiga header.
        var claveEsperada = _options.ApiKey;
        if (string.IsNullOrWhiteSpace(claveEsperada))
        {
            _logger.LogWarning("BotApi:ApiKey no está configurada; se rechaza el request con 503");
            context.Result = new StatusCodeResult(StatusCodes.Status503ServiceUnavailable);
            return;
        }

        // 2) Header ausente, vacío o repetido -> 401.
        var valores = context.HttpContext.Request.Headers[HeaderName];
        if (valores.Count != 1 || string.IsNullOrEmpty(valores[0]))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // 3) Se hashean ambos lados para que los largos siempre coincidan: así FixedTimeEquals
        //    corre en tiempo constante y no filtra el largo de la clave real.
        var hashEsperado = SHA256.HashData(Encoding.UTF8.GetBytes(claveEsperada));
        var hashRecibido = SHA256.HashData(Encoding.UTF8.GetBytes(valores[0]!));

        if (!CryptographicOperations.FixedTimeEquals(hashEsperado, hashRecibido))
            context.Result = new UnauthorizedResult();

        // 4) Coincide: no se asigna Result y el request sigue.
    }
}
