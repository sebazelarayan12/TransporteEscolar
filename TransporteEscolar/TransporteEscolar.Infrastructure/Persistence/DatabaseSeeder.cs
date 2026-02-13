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
            new Titular("ABDALA", "Sin especificar", "Sin especificar", 115000m),
            new Titular("ALMADA", "Sin especificar", "Sin especificar", 70000m),
            new Titular("AMENABAR", "Sin especificar", "Sin especificar", 200000m),
            new Titular("ARALDE", "Sin especificar", "Sin especificar", 70000m),
            new Titular("ARGIRO", "Sin especificar", "Sin especificar", 135000m),
            new Titular("AVELLANEDA", "Sin especificar", "Sin especificar", 105000m),
            new Titular("BEMERGUI", "Sin especificar", "Sin especificar", 160000m),
            new Titular("BERTIKIAN CORBALAN", "Sin especificar", "Sin especificar", 70000m),
            new Titular("BORMIDA", "Sin especificar", "Sin especificar", 120000m),
            new Titular("BOSSI", "Sin especificar", "Sin especificar", 180000m),
            new Titular("CAPETTA", "Sin especificar", "Sin especificar", 120000m),
            new Titular("CATAUDELLA", "Sin especificar", "Sin especificar", 130000m),
            new Titular("CHEVAIA", "Sin especificar", "Sin especificar", 80000m),
            new Titular("COLETTI", "Sin especificar", "Sin especificar", 115000m),
            new Titular("CORTINA", "Sin especificar", "Sin especificar", 130000m),
            new Titular("COSIO", "Sin especificar", "Sin especificar", 95000m),
            new Titular("COTELLA", "Sin especificar", "Sin especificar", 105000m),
            new Titular("DOMINGO PRADA", "Sin especificar", "Sin especificar", 160000m),
            new Titular("FLIGMAN TRE", "Sin especificar", "Sin especificar", 70000m),
            new Titular("GAROLERA", "Sin especificar", "Sin especificar", 100000m),
            new Titular("GIL", "Sin especificar", "Sin especificar", 85000m),
            new Titular("GONZALES", "Sin especificar", "Sin especificar", 70000m),
            new Titular("GRANADA PALLA", "Sin especificar", "Sin especificar", 140000m),
            new Titular("GRANDI MARGARITA", "Sin especificar", "Sin especificar", 100000m),
            new Titular("KOVACEVICH", "Sin especificar", "Sin especificar", 60000m),
            new Titular("LESTARD NOVILLO", "Sin especificar", "Sin especificar", 155000m),
            new Titular("MAMBRINI", "Sin especificar", "Sin especificar", 160000m),
            new Titular("MARQUEZ", "Sin especificar", "Sin especificar", 55000m),
            new Titular("MARTINEZ PARDO", "Sin especificar", "Sin especificar", 140000m),
            new Titular("MASEO NUCCI", "Sin especificar", "Sin especificar", 70000m),
            new Titular("MAYORAL", "Sin especificar", "Sin especificar", 100000m),
            new Titular("MOLAS Y MOLAD", "Sin especificar", "Sin especificar", 75000m),
            new Titular("MOYANO", "Sin especificar", "Sin especificar", 150000m),
            new Titular("NAVARRO PAZ", "Sin especificar", "Sin especificar", 120000m),
            new Titular("ORTEGA BUSSI", "Sin especificar", "Sin especificar", 125000m),
            new Titular("OTORLANI", "Sin especificar", "Sin especificar", 80000m),
            new Titular("PAZ BARRio CONGRESO", "Sin especificar", "Sin especificar", 70000m),
            new Titular("PAZ COSIO", "Sin especificar", "Sin especificar", 65000m),
            new Titular("PELUFFO", "Sin especificar", "Sin especificar", 140000m),
            new Titular("PERALTA", "Sin especificar", "Sin especificar", 105000m),
            new Titular("RAIMONDI", "Sin especificar", "Sin especificar", 70000m),
            new Titular("RE", "Sin especificar", "Sin especificar", 110000m),
            new Titular("RODAS", "Sin especificar", "Sin especificar", 60000m),
            new Titular("ROUGUES", "Sin especificar", "Sin especificar", 170000m),
            new Titular("RUFINA HERNANDEZ", "Sin especificar", "Sin especificar", 85000m),
            new Titular("RUIZ", "Sin especificar", "Sin especificar", 150000m),
            new Titular("SALAS", "Sin especificar", "Sin especificar", 60000m),
            new Titular("SALAS CLARA", "Sin especificar", "Sin especificar", 60000m),
            new Titular("SALEME", "Sin especificar", "Sin especificar", 75000m),
            new Titular("SOL GIM", "Sin especificar", "Sin especificar", 50000m),
            new Titular("TALARICO", "Sin especificar", "Sin especificar", 70000m),
            new Titular("AMENABAR", "Sin especificar", "Sin especificar", 70000m),
            new Titular("BEMERGUI", "Sin especificar", "Sin especificar", 70000m),
            new Titular("BOSSI", "Sin especificar", "Sin especificar", 50000m),
            new Titular("BUSSI ORTEGA", "Sin especificar", "Sin especificar", 50000m),
            new Titular("GRANADA PALLA", "Sin especificar", "Sin especificar", 65000m),
            new Titular("GRANDI", "Sin especificar", "Sin especificar", 50000m)
        };

        context.Titulares.AddRange(titulares);
        await context.SaveChangesAsync();
    }
}
