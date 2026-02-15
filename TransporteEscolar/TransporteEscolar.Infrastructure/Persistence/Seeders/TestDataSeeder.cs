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

        if (!context.Horarios.Any())
        {
            var horariosSeed = new[]
            {
                new Horario("8 San Patricio", 1),
                new Horario("8 Boisdron", 2),
                new Horario("9 Boisdron", 3),
                new Horario("9 San Patricio", 4),
                new Horario("12 San Patricio", 5),
                new Horario("13 Boisdron Entrada", 6),
                new Horario("13 Boisdron Salida", 7),
                new Horario("16 San Patricio", 8),
                new Horario("17 Boisdron", 9)
            };

            context.Horarios.AddRange(horariosSeed);
            context.SaveChanges();
        }

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

        var horarios = context.Horarios.ToList();
        var horarioPorEtiqueta = horarios.ToDictionary(h => h.Etiqueta, h => h.Id);

        var pasajerosDemo = new List<Pasajero>
        {
            new Pasajero(titulares[0].Id, "Agustina Demo", "San Patricio", "4A", "Mañana", null, fechaAltaSeeder),
            new Pasajero(titulares[1].Id, "Julián Demo", "Boisdron", "5B", "Mañana", null, fechaAltaSeeder),
            new Pasajero(titulares[2].Id, "Victoria Demo", "San Patricio", "3C", "Tarde", "Requiere punto intermedio", fechaAltaSeeder),
            new Pasajero(titulares[3].Id, "Mateo Demo", "Boisdron", "1A", "Tarde", null, fechaAltaSeeder),
            new Pasajero(titulares[4].Id, "Lucía Demo", "San Patricio", "2A", "Mañana", null, fechaAltaSeeder)
        };

        context.Pasajeros.AddRange(pasajerosDemo);
        context.SaveChanges();

        var asignaciones = new List<PasajeroHorario>
        {
            new PasajeroHorario(pasajerosDemo[0].Id, horarioPorEtiqueta["8 San Patricio"], true, 1, fechaAltaSeeder),
            new PasajeroHorario(pasajerosDemo[0].Id, horarioPorEtiqueta["16 San Patricio"], false, 2, fechaAltaSeeder),
            new PasajeroHorario(pasajerosDemo[1].Id, horarioPorEtiqueta["8 Boisdron"], true, 1, fechaAltaSeeder),
            new PasajeroHorario(pasajerosDemo[1].Id, horarioPorEtiqueta["13 Boisdron Entrada"], false, 2, fechaAltaSeeder),
            new PasajeroHorario(pasajerosDemo[2].Id, horarioPorEtiqueta["12 San Patricio"], true, 1, fechaAltaSeeder),
            new PasajeroHorario(pasajerosDemo[3].Id, horarioPorEtiqueta["16 San Patricio"], true, 1, fechaAltaSeeder),
            new PasajeroHorario(pasajerosDemo[4].Id, horarioPorEtiqueta["9 San Patricio"], true, 1, fechaAltaSeeder)
        };

        context.PasajeroHorarios.AddRange(asignaciones);
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
        Console.WriteLine($"   - {context.Pasajeros.Count()} pasajeros creados");
        Console.WriteLine($"   - {context.PagosMensuales.Count()} pagos mensuales (facturas) creados");
    }
}
