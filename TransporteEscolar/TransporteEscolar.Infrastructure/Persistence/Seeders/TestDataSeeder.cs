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
        var titular1 = new Titular("González", "Contacto Test", "Dirección Test", 25000, fechaAltaSeeder);
        var titular2 = new Titular("Rodríguez", "Contacto Test", "Dirección Test", 30000, fechaAltaSeeder);
        var titular3 = new Titular("Fernández", "Contacto Test", "Dirección Test", 20000, fechaAltaSeeder);
        var titular4 = new Titular("López", "Contacto Test", "Dirección Test", 28000, fechaAltaSeeder);
        var titular5 = new Titular("Martínez", "Contacto Test", "Dirección Test", 22000, fechaAltaSeeder);

        context.Titulares.AddRange(titular1, titular2, titular3, titular4, titular5);
        context.SaveChanges();

        // Crear pagos mensuales (facturas) de los últimos 3 meses

        // Mes actual y 2 meses anteriores para cada titular
        foreach (var titular in new[] { titular1, titular2, titular3, titular4, titular5 })
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
