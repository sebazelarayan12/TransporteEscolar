using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using MediatR;
using Microsoft.Extensions.Options;
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

        // Servicios
        services.AddScoped<ITitularService, TitularService>();
        services.AddScoped<IReinscripcionService, ReinscripcionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IHorarioService, HorarioService>();
        services.AddScoped<IGastoService, GastoService>();
        services.AddScoped<IIngresoService, IngresoService>();
        services.AddScoped<INotificacionService, NotificacionService>();
        services.AddScoped<IRecorridoService, RecorridoService>();
        services.AddScoped<IRecorridoMarginalService, RecorridoMarginalService>();
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
        services.AddScoped<IMercadoPagoService, MercadoPagoService>();

        // Gestión de Transacciones
        services.AddScoped<ITransactionManager, TransactionManager>();

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<AssemblyMarker>());

        return services;
    }

    /// <summary>
    /// Registra la integración con Meta WhatsApp Cloud API.
    /// Llama a este método desde Program.cs pasando la configuración.
    /// </summary>
    public static IServiceCollection AddWhatsAppIntegration(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Vincula las opciones desde la sección "MetaWhatsApp" de appsettings
        services.Configure<MetaWhatsAppOptions>(
            configuration.GetSection(MetaWhatsAppOptions.SectionName));

        // Opciones de nombre de plantilla (para que Application no dependa de Infrastructure)
        services.Configure<WhatsAppTemplateName>(
            configuration.GetSection(WhatsAppTemplateName.SectionName));

        // HttpClient tipado: inyecta el Bearer Token automáticamente en cada request
        services.AddHttpClient<IWhatsAppProvider, MetaWhatsAppProvider>((sp, client) =>
        {
            var token = configuration["MetaWhatsApp:AccessToken"];
            if (!string.IsNullOrEmpty(token))
                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        });

        // Repositorio de lotes (Infrastructure accede al AppDbContext)
        services.AddScoped<IWhatsAppLoteRepository, WhatsAppLoteRepository>();

        // Servicio de lotes (Application usa el repositorio)
        services.AddScoped<IWhatsAppLoteService, WhatsAppLoteService>();

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
}
