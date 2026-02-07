using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Api.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Repositorios
        services.AddScoped<ITitularRepository, TitularRepository>();
        services.AddScoped<IPasajeroRepository, PasajeroRepository>();
        services.AddScoped<IPagoMensualRepository, PagoMensualRepository>();
        services.AddScoped<IReinscripcionRepository, ReinscripcionRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        
        // Servicios
        services.AddScoped<ITitularService, TitularService>();
        services.AddScoped<IPasajeroService, PasajeroService>();
        services.AddScoped<IPagoMensualService, PagoMensualService>();
        services.AddScoped<IReinscripcionService, ReinscripcionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        
        return services;
    }
}
