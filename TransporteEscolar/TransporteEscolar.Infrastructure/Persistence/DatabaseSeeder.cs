using System.Linq;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedDevelopmentDataAsync(AppDbContext context)
    {
        // Solo ejecutar en desarrollo y si la DB está vacía
        if (await context.Titulares.AnyAsync())
            return;

        var titulares = Enumerable.Range(1, 30)
            .Select(index => new Titular(
                $"Familia Demo {index:00}",
                $"Contacto Demo {index:00}",
                $"Dirección Demo {index:00}",
                60000m + index * 2500m))
            .ToArray();

        context.Titulares.AddRange(titulares);
        await context.SaveChangesAsync();
    }
}
