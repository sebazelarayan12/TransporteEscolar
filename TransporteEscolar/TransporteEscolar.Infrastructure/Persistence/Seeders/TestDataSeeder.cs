using System.Linq;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Seeders;

public static class TestDataSeeder
{
    public static void SeedTestData(AppDbContext context)
    {
        // Si ya hay datos, no seedear
        if (context.Titulares.Any())
        {
            Console.WriteLine("⚠️ La base de datos ya contiene datos. No se ejecutará el seeder.");
            return;
        }

        Console.WriteLine("🌱 Ejecutando seeder de datos de prueba...");

        var ahoraUtc = DateTime.UtcNow;
        var hoyUtc = DateTime.SpecifyKind(ahoraUtc.Date, DateTimeKind.Utc);
        // Crear titulares de prueba (solo apellido y monto pactado)
        var fechaAltaSeeder = hoyUtc;
        var titulares = Enumerable.Range(1, 5)
            .Select(i => new Titular(
                $"Familia Demo {i:00}",
                $"Contacto Demo {i:00}",
                $"Dirección Demo {i:00}",
                20000m + i * 5000m,
                fechaAltaSeeder))
            .ToList();

        context.Titulares.AddRange(titulares);
        context.SaveChanges();

        // Crear pagos mensuales (facturas) de los últimos 3 meses

        // Mes actual y 2 meses anteriores para cada titular
        foreach (var titular in titulares)
        {
            for (int i = 2; i >= 0; i--)
            {
                var fechaMes = hoyUtc.AddMonths(-i);
                var pagoMensual = new PagoMensual(
                    titular.Id,
                    fechaMes.Month,
                    fechaMes.Year,
                    titular.MontoMensualPactado,
                    null
                );
                context.PagosMensuales.Add(pagoMensual);
            }
        }

        context.SaveChanges();

        Console.WriteLine("✅ Seeder ejecutado exitosamente:");
        Console.WriteLine($"   - {context.Titulares.Count()} titulares creados");
        Console.WriteLine($"   - {context.PagosMensuales.Count()} pagos mensuales (facturas) creados");
    }
}
