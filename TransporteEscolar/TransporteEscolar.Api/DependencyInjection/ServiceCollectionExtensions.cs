using MediatR;
using TransporteEscolar.Application;
using TransporteEscolar.Application.Interfaces;
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

        // Servicios
        services.AddScoped<ITitularService, TitularService>();
        services.AddScoped<IReinscripcionService, ReinscripcionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IHorarioService, HorarioService>();
        services.AddScoped<IGastoService, GastoService>();
        services.AddScoped<IIngresoService, IngresoService>();
        services.AddScoped<INotificacionService, NotificacionService>();
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
}
