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
        services.AddScoped<IPasajeroHorarioRepository, PasajeroHorarioRepository>();
        services.AddScoped<IPagoMensualRepository, PagoMensualRepository>();
        services.AddScoped<IReinscripcionRepository, ReinscripcionRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IHorarioRepository, HorarioRepository>();
        services.AddScoped<IGastoRepository, GastoRepository>();
        services.AddScoped<IIngresoRepository, IngresoRepository>();
        
        // Servicios
        services.AddScoped<ITitularService, TitularService>();
        services.AddScoped<IPasajeroService, PasajeroService>();
        services.AddScoped<IPagoMensualService, PagoMensualService>();
        services.AddScoped<IReinscripcionService, ReinscripcionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IHorarioService, HorarioService>();
        services.AddScoped<IGastoService, GastoService>();
        services.AddScoped<IIngresoService, IngresoService>();

        return services;
    }
}
