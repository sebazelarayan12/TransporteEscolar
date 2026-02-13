using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedDevelopmentDataAsync(AppDbContext context)
    {
        // Solo ejecutar en desarrollo y si la DB est� vac�a
        if (await context.Titulares.AnyAsync())
            return;

        var titulares = new[]
        {
            new Titular("Gonz�lez", "Mar�a Gonz�lez", "Calle Falsa 123", 50000m),
            new Titular("P�rez", "Juan P�rez", "Av. Siempreviva 742", 45000m),
            new Titular("Rodr�guez", "Ana Rodr�guez", "Pasaje Los �lamos 456", 55000m)
        };

        context.Titulares.AddRange(titulares);
        await context.SaveChangesAsync();
    } /*hola*/
}
