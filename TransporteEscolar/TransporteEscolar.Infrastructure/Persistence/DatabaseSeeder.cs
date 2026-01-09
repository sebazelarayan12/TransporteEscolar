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

        var titulares = new[]
        {
            new Titular("González", "María González", "Calle Falsa 123", 50000m),
            new Titular("Pérez", "Juan Pérez", "Av. Siempreviva 742", 45000m),
            new Titular("Rodríguez", "Ana Rodríguez", "Pasaje Los Álamos 456", 55000m)
        };

        context.Titulares.AddRange(titulares);
        await context.SaveChangesAsync();
    }
}
