using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Api.Authentication;

/// <summary>
/// Requisito de acceso evaluado por <see cref="AccesoHandler"/>. Con <c>Auth:Enforce=false</c> (modo observación)
/// nunca rechaza: deja pasar y registra "habría rechazado".
/// </summary>
public sealed class AccesoRequirement : IAuthorizationRequirement
{
    public AccesoRequirement(Func<ClaimsPrincipal, bool> permitido)
    {
        Permitido = permitido;
    }

    public Func<ClaimsPrincipal, bool> Permitido { get; }
}

public sealed class AccesoHandler : AuthorizationHandler<AccesoRequirement>
{
    private readonly AuthOptions _opciones;
    private readonly ILogger<AccesoHandler> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AccesoHandler(IOptions<AuthOptions> opciones, ILogger<AccesoHandler> logger, IHttpContextAccessor httpContextAccessor)
    {
        _opciones = opciones.Value;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AccesoRequirement requirement)
    {
        if (requirement.Permitido(context.User))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (!_opciones.Enforce)
        {
            var http = context.Resource as HttpContext ?? _httpContextAccessor.HttpContext;
            _logger.LogWarning(
                "Modo observación: habría rechazado {Metodo} {Ruta}",
                http?.Request.Method,
                http?.Request.Path.Value);
            context.Succeed(requirement);
        }

        // Enforce=true y no permitido: no se llama a Succeed → 401 (sin identidad) o 403 (identidad sin permiso).
        return Task.CompletedTask;
    }
}
