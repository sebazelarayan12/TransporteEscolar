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

        // Crear titulares de prueba (solo apellido y monto pactado)
        var titular1 = new Titular("González", "Contacto Test", "Dirección Test", 25000);
        var titular2 = new Titular("Rodríguez", "Contacto Test", "Dirección Test", 30000);
        var titular3 = new Titular("Fernández", "Contacto Test", "Dirección Test", 20000);
        var titular4 = new Titular("López", "Contacto Test", "Dirección Test", 28000);
        var titular5 = new Titular("Martínez", "Contacto Test", "Dirección Test", 22000);

        context.Titulares.AddRange(titular1, titular2, titular3, titular4, titular5);
        context.SaveChanges();

        // Crear pagos mensuales (facturas) de los últimos 3 meses
        var hoy = DateTime.Now;

        // Mes actual y 2 meses anteriores para cada titular
        foreach (var titular in new[] { titular1, titular2, titular3, titular4, titular5 })
        {
            for (int i = 2; i >= 0; i--)
            {
                var fechaMes = hoy.AddMonths(-i);
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
