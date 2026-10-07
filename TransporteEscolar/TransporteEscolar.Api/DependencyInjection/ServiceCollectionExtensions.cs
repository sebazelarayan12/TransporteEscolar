using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Options;
using TransporteEscolar.Application;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;
using TransporteEscolar.Infrastructure.Services;

namespace TransporteEscolar.Api.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Repositorios
        services.AddScoped<ITitularRepository, TitularRepository>();
        services.AddScoped<IPasajeroRepository, PasajeroRepository>();
        services.AddScoped<IPasajeroHorarioRepository, PasajeroHorarioRepository>();
        services.AddScoped<IPagoMensualRepository, PagoMensualRepository>();
        services.AddScoped<IReinscripcionRepository, ReinscripcionRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IHorarioRepository, HorarioRepository>();
        services.AddScoped<IGastoRepository, GastoRepository>();
        services.AddScoped<IIngresoRepository, IngresoRepository>();
        services.AddScoped<INotificacionRepository, NotificacionRepository>();
        services.AddScoped<IPushSubscriptionRepository, PushSubscriptionRepository>();
        services.AddScoped<IColegioRepository, ColegioRepository>();
        services.AddScoped<ITitularUbicacionRepository, TitularUbicacionRepository>();
        services.AddScoped<IRecorridoRepository, RecorridoRepository>();
        services.AddScoped<IRecorridoHorarioRepository, RecorridoHorarioRepository>();
        services.AddScoped<IParadaFijaRepository, ParadaFijaRepository>();

        // Servicios
        services.AddScoped<ITitularService, TitularService>();
        services.AddScoped<IReinscripcionService, ReinscripcionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IHorarioService, HorarioService>();
        services.AddScoped<IGastoService, GastoService>();
        services.AddScoped<IIngresoService, IngresoService>();
        services.AddScoped<INotificacionService, NotificacionService>();
        services.AddScoped<IRecorridoService, RecorridoService>();
        services.AddScoped<IRecorridoRepartoService, RecorridoRepartoService>();
        services.AddSingleton<PushServiceClient>(sp =>
        {
            var vapid = sp.GetRequiredService<IOptions<VapidSettings>>().Value;
            return new PushServiceClient
            {
                DefaultAuthentication = new VapidAuthentication(vapid.PublicKey, vapid.PrivateKey)
                {
                    Subject = vapid.Subject
                }
            };
        });
        services.AddScoped<IWebPushService, WebPushService>();

        // Gestión de Transacciones
        services.AddScoped<ITransactionManager, TransactionManager>();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<AssemblyMarker>());

        return services;
    }

    /// <summary>
    /// Registra el repositorio de lotes de WhatsApp, que usa la consulta de pagos pendientes para notificar.
    /// El envío por Meta WhatsApp Cloud API se eliminó: el bot manual del dueño es quien manda los mensajes.
    /// </summary>
    public static IServiceCollection AddWhatsAppLoteRepository(this IServiceCollection services)
    {
        services.AddScoped<IWhatsAppLoteRepository, WhatsAppLoteRepository>();

        return services;
    }

    /// <summary>
    /// Registra el motor de ruteo. La URL base viene de la variable de entorno
    /// <c>Ruteo__BaseUrl</c>; nunca se hardcodea.
    /// </summary>
    public static IServiceCollection AddRuteo(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ValidateOnStart hace que la app falle AL ARRANCAR, con un mensaje claro, si falta
        // Ruteo__BaseUrl. Sin esto la validación correría recién al resolver IRutaProvider por
        // primera vez, y como TitularesController depende de IRecorridoService (Task 8), una
        // variable faltante rompería TODOS los endpoints de titulares en vez de fallar el deploy.
        services.AddOptions<RuteoOptions>()
            .Bind(configuration.GetSection(RuteoOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddHttpClient<IRutaProvider, OsrmRutaProvider>((sp, client) =>
        {
            var opciones = sp.GetRequiredService<IOptions<RuteoOptions>>().Value;

            client.BaseAddress = new Uri(opciones.BaseUrl.TrimEnd('/'));
            client.Timeout = TimeSpan.FromSeconds(opciones.TimeoutSegundos);

            // El demo público de OSRM pide identificar al cliente.
            client.DefaultRequestHeaders.UserAgent.ParseAdd("TransporteEscolar/1.0");
        });

        return services;
    }

    /// <summary>
    /// Registra el acceso de los clientes máquina-a-máquina: catálogo de clientes (<c>ApiClients__*</c> y el
    /// alias <c>BotApi__ApiKey</c>), el esquema de autenticación ApiKey y la política del bot.
    /// No es global: solo protege lo que lleve <c>[Authorize(Policy = ...)]</c>.
    /// </summary>
    public static IServiceCollection AddBotApi(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var configurados = configuration.GetSection(ApiClientOptions.SectionName)
            .Get<Dictionary<string, ApiClientOptions>>() ?? new Dictionary<string, ApiClientOptions>();
        var claveHeredada = configuration.GetSection(BotApiOptions.SectionName).Get<BotApiOptions>()?.ApiKey;

        services.AddSingleton(new ApiClientCatalog(configurados, claveHeredada));

        services.AddAuthentication()
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                ApiKeyAuthenticationHandler.SchemeName, configureOptions: null);

        services.AddAuthorization(opciones =>
        {
            opciones.AddPolicy(ApiPolicies.BotIdentidad, politica => politica
                .AddAuthenticationSchemes(ApiKeyAuthenticationHandler.SchemeName)
                .RequireAuthenticatedUser()
                .RequireClaim(ApiKeyAuthenticationHandler.ScopeClaim, ApiClientCatalog.ScopeBotIdentidad));
        });

        return services;
    }
}
