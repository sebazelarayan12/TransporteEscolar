using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Tests.Infrastructure.Repositories;

public class GastoRepositoryBotTests
{
    private static readonly DateTime Ahora = new(2026, 10, 8, 12, 0, 0, DateTimeKind.Utc);

    private static AppDbContext CrearContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static GastoMensual CrearGastoDeBot(string mensajeId)
    {
        var gasto = new GastoMensual(10, 2026, GastoMensual.TipoVariable, "Combustible", "Nafta", 4500m,
            new DateTime(2026, 10, 8), "Efectivo", EstadoPagoGasto.Pagado);
        gasto.MarcarComoCargadoPorBot(mensajeId, Ahora);
        return gasto;
    }

    [Fact]
    public async Task ObtenerGastoMensualPorOrigenMensajeIdAsync_DevuelveElGastoGuardado()
    {
        await using var context = CrearContexto();
        context.GastosMensuales.Add(CrearGastoDeBot("wamid.abc"));
        await context.SaveChangesAsync();
        var repo = new GastoRepository(context);

        var resultado = await repo.ObtenerGastoMensualPorOrigenMensajeIdAsync("wamid.abc");

        resultado.Should().NotBeNull();
        resultado!.OrigenMensajeId.Should().Be("wamid.abc");
        resultado.FechaCreacion.Should().Be(Ahora);
    }

    [Fact]
    public async Task ObtenerGastoMensualPorOrigenMensajeIdAsync_ConIdInexistente_DevuelveNull()
    {
        await using var context = CrearContexto();
        context.GastosMensuales.Add(CrearGastoDeBot("wamid.abc"));
        await context.SaveChangesAsync();
        var repo = new GastoRepository(context);

        var resultado = await repo.ObtenerGastoMensualPorOrigenMensajeIdAsync("wamid.otro");

        resultado.Should().BeNull();
    }

    [Fact]
    public async Task AgregarGastoDeBotAsync_CaminoNormal_DevuelveCreadoYPersiste()
    {
        await using var context = CrearContexto();
        var repo = new GastoRepository(context);

        var (gasto, creado) = await repo.AgregarGastoDeBotAsync(CrearGastoDeBot("wamid.nuevo"));

        creado.Should().BeTrue();
        gasto.Id.Should().BeGreaterThan(0);
        (await context.GastosMensuales.CountAsync(g => g.OrigenMensajeId == "wamid.nuevo")).Should().Be(1);
    }
}
