using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Tests.Infrastructure.Repositories;

public class ConfirmacionDiciembreRepositoryTests
{
    private const int Anio = 2026;

    private static AppDbContext CrearContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public void Modelo_FkAPagosMensuales_EsSetNull_Y_FkATitulares_EsCascade()
    {
        using var context = CrearContexto();

        var entidad = context.Model.FindEntityType(typeof(ConfirmacionDiciembre));

        entidad.Should().NotBeNull();
        var fkCuota = entidad!.GetForeignKeys().Single(fk => fk.PrincipalEntityType.ClrType == typeof(PagoMensual));
        var fkTitular = entidad.GetForeignKeys().Single(fk => fk.PrincipalEntityType.ClrType == typeof(Titular));

        fkCuota.DeleteBehavior.Should().Be(DeleteBehavior.SetNull);
        fkTitular.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);
    }

    [Fact]
    public void Modelo_TieneIndiceUnicoPorTitularYAnio()
    {
        using var context = CrearContexto();

        var entidad = context.Model.FindEntityType(typeof(ConfirmacionDiciembre))!;
        var indice = entidad.GetIndexes().Single(i => i.IsUnique);

        indice.Properties.Select(p => p.Name).Should().BeEquivalentTo(new[] { "TitularId", "Anio" });
    }

    [Fact]
    public async Task GetCuotaDiciembreAsync_CargaMovimientosYDevuelveEntidadTrackeada()
    {
        await using var context = CrearContexto();
        var titular = new Titular("Perez", "Ana", "Calle 1", 120000m);
        context.Titulares.Add(titular);
        await context.SaveChangesAsync();
        var cuota = new PagoMensual(titular.Id, 12, Anio, 60000m);
        context.PagosMensuales.Add(cuota);
        await context.SaveChangesAsync();
        cuota.AplicarPago(20000m, DateTimeOffset.UtcNow, "Efectivo", null);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        var repo = new ConfirmacionDiciembreRepository(context);

        var cargada = await repo.GetCuotaDiciembreAsync(titular.Id, Anio);

        cargada.Should().NotBeNull();
        cargada!.Movimientos.Should().HaveCount(1);
        context.Entry(cargada).State.Should().Be(EntityState.Unchanged);
    }

    [Fact]
    public async Task GetListadoAsync_ExcluyeTitularesDadosDeBajaYSinPasajerosActivos()
    {
        await using var context = CrearContexto();
        var activo = new Titular("Perez", "Ana", "Calle 1", 120000m);
        var dadoDeBaja = new Titular("Lopez", "Luis", "Calle 2", 120000m);
        var sinPasajeros = new Titular("Diaz", "Marta", "Calle 3", 120000m);
        context.Titulares.AddRange(activo, dadoDeBaja, sinPasajeros);
        await context.SaveChangesAsync();
        dadoDeBaja.DarDeBaja();
        context.Pasajeros.Add(new Pasajero(activo.Id, "Juan", "Colegio", "3ro", "Mañana"));
        context.Pasajeros.Add(new Pasajero(dadoDeBaja.Id, "Pedro", "Colegio", "3ro", "Mañana"));
        await context.SaveChangesAsync();
        var repo = new ConfirmacionDiciembreRepository(context);

        var listado = await repo.GetListadoAsync(Anio, null);

        listado.Select(t => t.TitularId).Should().Equal(activo.Id);
    }
}
