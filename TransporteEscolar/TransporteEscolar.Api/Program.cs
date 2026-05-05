using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using TransporteEscolar.Api.Configuration;
using TransporteEscolar.Api.Converters;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.HostedServices;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Api.Options;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            DotEnvLoader.Load(environmentName);

            var builder = WebApplication.CreateBuilder(args);

            // DbContext
            builder.Services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(builder.Configuration.GetConnectionString("Default"));
            });

            // Registrar servicios y repositorios
            builder.Services.AddApplicationServices();
            builder.Services.AddWhatsAppIntegration(builder.Configuration);
            builder.Services.Configure<MercadoPagoSettings>(builder.Configuration.GetSection(MercadoPagoSettings.SectionName));
            builder.Services.Configure<ReleaseNotesOptions>(builder.Configuration.GetSection("ReleaseNotes"));
            builder.Services.Configure<VapidSettings>(builder.Configuration.GetSection(VapidSettings.SectionName));
            builder.Services.AddHostedService<ReleaseNotesInitializer>();

            // CORS - Configurado dinámicamente mediante variable de entorno
            var allowedOrigins = builder.Configuration.GetValue<string>("AllowedOrigins")
                ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                ?? Array.Empty<string>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    if (allowedOrigins.Length > 0)
                    {
                        policy.WithOrigins(allowedOrigins)
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                    else
                    {
                        // Fallback para desarrollo local si no hay variable configurada
                        policy.WithOrigins(
                                  "http://localhost:5173",
                                  "http://127.0.0.1:5173"
                              )
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    }
                });
            });

            // API
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    // Formato de fecha: solo año-mes-día (2026-01-11)
                    options.JsonSerializerOptions.Converters.Add(new DateOnlyJsonConverter());
                    options.JsonSerializerOptions.Converters.Add(new NullableDateOnlyJsonConverter());
                    options.JsonSerializerOptions.Converters.Add(
                        new System.Text.Json.Serialization.JsonStringEnumConverter());
                });
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
            });

            var app = builder.Build();

            // Middleware de manejo global de excepciones
            app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

            // CORS - Debe ir antes de Authorization
            app.UseCors("AllowFrontend");

            // Middleware
            if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();

            // ===== AUTO-MIGRATION =====
            // Ejecuta migraciones automáticamente al iniciar la aplicación en cualquier entorno
            
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                // Ejecutar migraciones pendientes
                context.Database.Migrate();
            }
            // ===============================

            app.Run();
        }
    }
}
