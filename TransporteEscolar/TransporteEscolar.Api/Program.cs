using Microsoft.EntityFrameworkCore;
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
                options.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
            });

            // Registrar servicios y repositorios
            builder.Services.AddApplicationServices();

            // API
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
            });

            var app = builder.Build();

            // Middleware de manejo global de excepciones
            app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

            // Middleware
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }
    }
}