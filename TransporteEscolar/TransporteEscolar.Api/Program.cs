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

            // ⚠️ CORS - SOLO PARA DESARROLLO ⚠️
            // 🔒 ANTES DE PRODUCCIÓN: 
            //    1. Eliminar AllowAnyOrigin() y usar WithOrigins() con dominios específicos
            //    2. Validar que solo dominios de producción estén permitidos
            //    3. Considerar usar políticas CORS más restrictivas
            //    4. NO usar AllowCredentials() con AllowAnyOrigin()
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    // DESARROLLO: Permite localhost y red local (192.168.1.23 es la IP local de desarrollo)
                    policy.WithOrigins(
                              "http://localhost:5173",           // Desarrollo en PC
                              "http://192.168.1.23:5173",        // Mobile/tablet en red local
                              "http://localhost:5074",           // Backend local
                              "http://192.168.1.23:5074"         // Backend en red local
                          )
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
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

            // ===== AMBIENTE DE TESTING =====
            // Descomentar las líneas de abajo para habilitar el seeder de datos de prueba
            // NOTA: Esto solo se ejecuta en el ambiente "Testing" y NO toca la base de datos de producción
            
            if (app.Environment.IsEnvironment("Testing"))
            {
                using var scope = app.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                context.Database.Migrate();
                TransporteEscolar.Infrastructure.Persistence.Seeders.TestDataSeeder.SeedTestData(context);
            }
            // ===============================

            app.Run();
        }
    }
}
