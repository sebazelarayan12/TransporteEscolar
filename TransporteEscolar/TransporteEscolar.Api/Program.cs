using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using TransporteEscolar.Api.Converters;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // DbContext
            builder.Services.AddDbContext<AppDbContext>(options =>
            {
                options.UseNpgsql(builder.Configuration.GetConnectionString("Default"));
            });

            // Registrar servicios y repositorios
            builder.Services.AddApplicationServices();

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
                                  "http://192.168.1.23:5173"
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

            // ===== AUTO-MIGRATION Y SEED =====
            // Ejecuta migraciones automáticamente y carga datos iniciales si la BD está vacía
            // Funciona en entornos Development, Testing y Production
            
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                // Ejecutar migraciones pendientes
                context.Database.Migrate();
                
                // Cargar datos iniciales (solo si la tabla Titulares está vacía)
                DatabaseSeeder.SeedDevelopmentDataAsync(context).Wait();
            }
            // ===============================

            app.Run();
        }
    }
}
