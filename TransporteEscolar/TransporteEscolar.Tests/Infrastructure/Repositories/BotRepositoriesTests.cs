using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Tests.Infrastructure.Repositories;

public class BotRepositoriesTests
{
    private static AppDbContext CrearContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<Titular> AgregarTitularAsync(AppDbContext context, string apellido, bool deBaja = false)
    {
        var titular = new Titular(apellido, "Contacto", "Calle 1", 1000m);
        if (deBaja)
            titular.DarDeBaja();

        context.Titulares.Add(titular);
        await context.SaveChangesAsync();
        return titular;
    }

    private static async Task<TitularTelefono> AgregarTelefonoAsync(
        AppDbContext context, Titular titular, string numero, bool deBaja = false)
    {
        var telefono = new TitularTelefono(titular.Id, numero);
        if (deBaja)
            telefono.DarDeBaja();

        context.TitularesTelefonos.Add(telefono);
        await context.SaveChangesAsync();
        return telefono;
    }

    private static async Task<Pasajero> AgregarPasajeroAsync(
        AppDbContext context, Titular titular, string nombre, bool deBaja = false)
    {
        var pasajero = new Pasajero(titular.Id, nombre, "Colegio", "1ro", "Mañana");
        if (deBaja)
            pasajero.DarDeBaja();

        context.Pasajeros.Add(pasajero);
        await context.SaveChangesAsync();
        return pasajero;
    }

    [Fact]
    public async Task GetTelefonosActivosAsync_ExcluyeTelefonosYTitularesDadosDeBaja()
    {
        await using var context = CrearContexto();

        var activo = await AgregarTitularAsync(context, "Perez");
        var deBaja = await AgregarTitularAsync(context, "Lopez", deBaja: true);

        await AgregarTelefonoAsync(context, activo, "+543814123456");
        await AgregarTelefonoAsync(context, activo, "+543814999999", deBaja: true);
        await AgregarTelefonoAsync(context, deBaja, "+543815555555");

        var repository = new TitularRepository(context);
        var telefonos = await repository.GetTelefonosActivosAsync();

        telefonos.Should().ContainSingle();
        telefonos[0].TitularId.Should().Be(activo.Id);
        telefonos[0].NumeroE164.Should().Be("+543814123456");
    }

    [Fact]
    public async Task GetNombresActivosPorTitularesAsync_ExcluyePasajerosYTitularesDadosDeBaja()
    {
        await using var context = CrearContexto();

        var activo = await AgregarTitularAsync(context, "Perez");
        var deBaja = await AgregarTitularAsync(context, "Lopez", deBaja: true);

        var juan = await AgregarPasajeroAsync(context, activo, "Juan");
        await AgregarPasajeroAsync(context, activo, "Sofia", deBaja: true);
        await AgregarPasajeroAsync(context, deBaja, "Pedro");

        var repository = new PasajeroRepository(context);
        var pasajeros = await repository.GetNombresActivosPorTitularesAsync(new[] { activo.Id, deBaja.Id });

        pasajeros.Should().ContainSingle();
        pasajeros[0].Id.Should().Be(juan.Id);
        pasajeros[0].TitularId.Should().Be(activo.Id);
        pasajeros[0].Nombre.Should().Be("Juan");
    }

    [Fact]
    public async Task GetNombresActivosPorTitularesAsync_SoloDevuelveLosTitularesPedidos()
    {
        await using var context = CrearContexto();

        var uno = await AgregarTitularAsync(context, "Perez");
        var dos = await AgregarTitularAsync(context, "Gomez");

        var delUno = await AgregarPasajeroAsync(context, uno, "Juan");
        await AgregarPasajeroAsync(context, dos, "Ana");

        var repository = new PasajeroRepository(context);
        var pasajeros = await repository.GetNombresActivosPorTitularesAsync(new[] { uno.Id });

        pasajeros.Should().ContainSingle().Which.Id.Should().Be(delUno.Id);
    }

    [Fact]
    public async Task GetNombresActivosPorTitularesAsync_ConListaVacia_DevuelveVacio()
    {
        await using var context = CrearContexto();

        var titular = await AgregarTitularAsync(context, "Perez");
        await AgregarPasajeroAsync(context, titular, "Juan");

        var repository = new PasajeroRepository(context);
        var pasajeros = await repository.GetNombresActivosPorTitularesAsync(Array.Empty<int>());

        pasajeros.Should().BeEmpty();
    }
}
