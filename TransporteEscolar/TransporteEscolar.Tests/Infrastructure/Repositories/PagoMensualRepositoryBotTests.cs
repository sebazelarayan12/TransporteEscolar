using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Tests.Infrastructure.Repositories;

public class PagoMensualRepositoryBotTests
{
    private static readonly DateTime Ahora = new(2026, 10, 9, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTimeOffset FechaPago = new(2026, 10, 9, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid Grupo = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private static AppDbContext CrearContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    /// <summary>Crea un titular y un pago mensual por cada período indicado, todo persistido.</summary>
    private static async Task<List<PagoMensual>> CrearPagosAsync(AppDbContext context, params (int Mes, int Anio)[] periodos)
    {
        var titular = new Titular("Perez", "Ana", "Calle 1", 1000m);
        context.Titulares.Add(titular);
        await context.SaveChangesAsync();

        var pagos = periodos
            .Select(p => new PagoMensual(titular.Id, p.Mes, p.Anio, 120000m))
            .ToList();
        context.PagosMensuales.AddRange(pagos);
        await context.SaveChangesAsync();

        return pagos;
    }

    private static PagoMovimiento CrearMovimientoDeBot(int pagoId, string origen, Guid grupo, decimal monto = 120000m)
    {
        var movimiento = new PagoMovimiento(pagoId, monto, FechaPago, "Efectivo");
        movimiento.MarcarComoCargadoPorBot(origen, grupo, Ahora);
        return movimiento;
    }

    [Fact]
    public async Task GetMovimientosPorOrigenMensajeIdAsync_DevuelveLosMovimientosConSuPagoCargado()
    {
        await using var context = CrearContexto();
        var pagos = await CrearPagosAsync(context, (9, 2026), (10, 2026));
        context.PagosMovimientos.AddRange(
            CrearMovimientoDeBot(pagos[0].Id, "hash.abc", Grupo),
            CrearMovimientoDeBot(pagos[1].Id, "hash.abc", Grupo, 30000m));
        await context.SaveChangesAsync();
        var repo = new PagoMensualRepository(context);

        var resultado = await repo.GetMovimientosPorOrigenMensajeIdAsync("hash.abc");

        resultado.Should().HaveCount(2);
        resultado.Should().OnlyContain(m => m.OrigenMensajeId == "hash.abc");
        resultado.All(m => m.PagoMensual != null).Should().BeTrue();
    }

    [Fact]
    public async Task GetMovimientosPorOrigenMensajeIdAsync_ConIdInexistente_DevuelveListaVacia()
    {
        await using var context = CrearContexto();
        var pagos = await CrearPagosAsync(context, (9, 2026));
        context.PagosMovimientos.Add(CrearMovimientoDeBot(pagos[0].Id, "hash.abc", Grupo));
        await context.SaveChangesAsync();
        var repo = new PagoMensualRepository(context);

        var resultado = await repo.GetMovimientosPorOrigenMensajeIdAsync("hash.otro");

        resultado.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMovimientosPorGrupoIdAsync_DevuelveTodosLosMovimientosDelGrupo()
    {
        await using var context = CrearContexto();
        var pagos = await CrearPagosAsync(context, (9, 2026), (10, 2026), (11, 2026));
        var otroGrupo = Guid.NewGuid();
        context.PagosMovimientos.AddRange(
            CrearMovimientoDeBot(pagos[0].Id, "hash.1", Grupo),
            CrearMovimientoDeBot(pagos[1].Id, "hash.1", Grupo, 30000m),
            CrearMovimientoDeBot(pagos[2].Id, "hash.2", otroGrupo));
        await context.SaveChangesAsync();
        var repo = new PagoMensualRepository(context);

        var resultado = await repo.GetMovimientosPorGrupoIdAsync(Grupo);

        resultado.Should().HaveCount(2);
        resultado.Should().OnlyContain(m => m.GrupoId == Grupo);
    }

    [Fact]
    public async Task EliminarMovimientosAsync_BorraSoloLosPasadosYDejaElResto()
    {
        await using var context = CrearContexto();
        var pagos = await CrearPagosAsync(context, (9, 2026));
        var movimientoManual = new PagoMovimiento(pagos[0].Id, 5000m, FechaPago, "Efectivo");
        context.PagosMovimientos.Add(movimientoManual);
        context.PagosMovimientos.Add(CrearMovimientoDeBot(pagos[0].Id, "hash.1", Grupo));
        await context.SaveChangesAsync();
        var repo = new PagoMensualRepository(context);
        var delGrupo = await repo.GetMovimientosPorGrupoIdAsync(Grupo);

        await repo.EliminarMovimientosAsync(delGrupo);

        var restantes = await context.PagosMovimientos.ToListAsync();
        restantes.Should().ContainSingle();
        restantes[0].Monto.Should().Be(5000m);
        restantes[0].EsDeBot.Should().BeFalse();
    }

    [Fact]
    public async Task GuardarPagoDeBotAsync_CaminoNormal_DevuelveTrueYPersiste()
    {
        await using var context = CrearContexto();
        var pagos = await CrearPagosAsync(context, (9, 2026));
        context.PagosMovimientos.Add(CrearMovimientoDeBot(pagos[0].Id, "hash.nuevo", Grupo));
        var repo = new PagoMensualRepository(context);

        var guardado = await repo.GuardarPagoDeBotAsync();

        guardado.Should().BeTrue();
        (await context.PagosMovimientos.CountAsync(m => m.OrigenMensajeId == "hash.nuevo")).Should().Be(1);
    }
}
