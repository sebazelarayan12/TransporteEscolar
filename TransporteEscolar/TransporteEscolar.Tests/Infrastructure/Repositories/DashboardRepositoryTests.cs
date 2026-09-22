using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Tests.Infrastructure.Repositories;

public class DashboardRepositoryTests
{
    private static AppDbContext CrearContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task ObtenerResumenAsync_ExcluyeCuotasDeTitularesDadosDeBaja()
    {
        await using var context = CrearContexto();

        var hoy = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);

        var titularActivo = new Titular("Garcia", "Juan", "Calle 1", 1000m);
        var pagoActivo = new PagoMensual(0, hoy.Month, hoy.Year, 1000m);

        var titularDeBaja = new Titular("Lopez", "Ana", "Calle 2", 5000m);
        titularDeBaja.DarDeBaja();
        var pagoDeBaja = new PagoMensual(0, hoy.Month, hoy.Year, 5000m);

        context.Titulares.AddRange(titularActivo, titularDeBaja);
        await context.SaveChangesAsync();

        typeof(PagoMensual).GetProperty(nameof(PagoMensual.TitularId))!
            .SetValue(pagoActivo, titularActivo.Id);
        typeof(PagoMensual).GetProperty(nameof(PagoMensual.TitularId))!
            .SetValue(pagoDeBaja, titularDeBaja.Id);

        context.PagosMensuales.AddRange(pagoActivo, pagoDeBaja);
        await context.SaveChangesAsync();

        var repository = new DashboardRepository(context);
        var resumen = await repository.ObtenerResumenAsync();

        // Sólo la cuota del titular activo debe contarse (1000), la del titular de baja (5000) no.
        (resumen.CantidadPendiente + resumen.CantidadVencido).Should().Be(1);
        (resumen.TotalPendiente + resumen.TotalVencido).Should().Be(1000m);
    }

    [Fact]
    public async Task ObtenerResumenAsync_ExcluyeCuotasVencidasDeMesesAnteriores()
    {
        await using var context = CrearContexto();

        var hoy = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);

        var titular = new Titular("Garcia", "Juan", "Calle 1", 1000m);

        // Cuota del mes actual, sin pagar (monto distintivo para poder rastrearla).
        var pagoMesActual = new PagoMensual(0, hoy.Month, hoy.Year, 1000m);

        // Cuota de hace 3 meses, sin pagar: objetivamente vencida (FechaVencimiento < hoy),
        // pero debe quedar afuera porque el resumen ahora se acota al mes en curso.
        var fechaVieja = hoy.AddMonths(-3);
        var pagoMesAnterior = new PagoMensual(0, fechaVieja.Month, fechaVieja.Year, 9999m);

        context.Titulares.Add(titular);
        await context.SaveChangesAsync();

        typeof(PagoMensual).GetProperty(nameof(PagoMensual.TitularId))!
            .SetValue(pagoMesActual, titular.Id);
        typeof(PagoMensual).GetProperty(nameof(PagoMensual.TitularId))!
            .SetValue(pagoMesAnterior, titular.Id);

        context.PagosMensuales.AddRange(pagoMesActual, pagoMesAnterior);
        await context.SaveChangesAsync();

        var repository = new DashboardRepository(context);
        var resumen = await repository.ObtenerResumenAsync();

        // Sólo la cuota del mes actual (1000) debe contarse; la de hace 3 meses (9999) no.
        (resumen.CantidadPendiente + resumen.CantidadVencido).Should().Be(1);
        (resumen.TotalPendiente + resumen.TotalVencido).Should().Be(1000m);
    }
}
