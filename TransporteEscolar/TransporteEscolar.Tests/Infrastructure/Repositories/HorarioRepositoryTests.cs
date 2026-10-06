using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Infrastructure.Persistence;
using TransporteEscolar.Infrastructure.Repositories;

namespace TransporteEscolar.Tests.Infrastructure.Repositories;

public class HorarioRepositoryTests
{
    private static AppDbContext CrearContexto()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<Horario> AgregarAsync(AppDbContext context, string etiqueta, int orden, bool activo = true)
    {
        var horario = Horario.Crear(etiqueta, orden, 1, SentidoHorario.Ida);
        if (!activo) horario.Desactivar();
        context.Horarios.Add(horario);
        await context.SaveChangesAsync();
        return horario;
    }

    [Fact]
    public async Task GetAllAsync_DevuelveSoloLosActivosOrdenadosPorOrden()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "9 San Patricio", 2);
        await AgregarAsync(context, "8 San Patricio", 1);
        await AgregarAsync(context, "10 Boisdron", 3, activo: false);
        var repo = new HorarioRepository(context);

        var resultado = await repo.GetAllAsync();

        resultado.Select(h => h.Etiqueta).Should().Equal("8 San Patricio", "9 San Patricio");
    }

    [Fact]
    public async Task GetTodosAsync_IncluyeLosInactivos()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "8 San Patricio", 1);
        await AgregarAsync(context, "10 Boisdron", 2, activo: false);
        var repo = new HorarioRepository(context);

        var resultado = await repo.GetTodosAsync();

        resultado.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetConColegioAsync_ExcluyeLosInactivos()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "8 San Patricio", 1);
        await AgregarAsync(context, "10 Boisdron", 2, activo: false);
        var repo = new HorarioRepository(context);

        var resultado = await repo.GetConColegioAsync();

        resultado.Should().ContainSingle().Which.Etiqueta.Should().Be("8 San Patricio");
    }

    [Fact]
    public async Task GetInactivosPorIdsAsync_DevuelveSoloLosInactivosDeLosIdsPedidos()
    {
        await using var context = CrearContexto();
        var activo = await AgregarAsync(context, "8 San Patricio", 1);
        var inactivoPedido = await AgregarAsync(context, "10 Boisdron", 2, activo: false);
        await AgregarAsync(context, "11 Boisdron", 3, activo: false); // inactivo pero no pedido
        var repo = new HorarioRepository(context);

        var resultado = await repo.GetInactivosPorIdsAsync(new[] { activo.Id, inactivoPedido.Id });

        resultado.Should().ContainSingle().Which.Id.Should().Be(inactivoPedido.Id);
    }

    [Fact]
    public async Task GetInactivosPorIdsAsync_SinIds_DevuelveListaVacia()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "10 Boisdron", 1, activo: false);
        var repo = new HorarioRepository(context);

        (await repo.GetInactivosPorIdsAsync(Array.Empty<int>())).Should().BeEmpty();
    }

    [Fact]
    public async Task GetByIdAsync_DevuelveTambienUnHorarioInactivo()
    {
        await using var context = CrearContexto();
        var inactivo = await AgregarAsync(context, "10 Boisdron", 1, activo: false);
        var repo = new HorarioRepository(context);

        var resultado = await repo.GetByIdAsync(inactivo.Id);

        resultado.Should().NotBeNull();
        resultado!.Activo.Should().BeFalse();
    }

    [Fact]
    public async Task ExisteAsync_EsFalsoParaUnHorarioInactivo()
    {
        await using var context = CrearContexto();
        var activo = await AgregarAsync(context, "8 San Patricio", 1);
        var inactivo = await AgregarAsync(context, "10 Boisdron", 2, activo: false);
        var repo = new HorarioRepository(context);

        (await repo.ExisteAsync(activo.Id)).Should().BeTrue();
        (await repo.ExisteAsync(inactivo.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task ExisteEtiquetaActivaAsync_IgnoraMayusculasYEspacios()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "8 San Patricio", 1);
        var repo = new HorarioRepository(context);

        (await repo.ExisteEtiquetaActivaAsync("  8 SAN patricio ", null)).Should().BeTrue();
    }

    [Fact]
    public async Task ExisteEtiquetaActivaAsync_ExcluyeElIdIndicado()
    {
        await using var context = CrearContexto();
        var horario = await AgregarAsync(context, "8 San Patricio", 1);
        var repo = new HorarioRepository(context);

        (await repo.ExisteEtiquetaActivaAsync("8 San Patricio", horario.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task ExisteEtiquetaActivaAsync_IgnoraLosHorariosInactivos()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "8 San Patricio", 1, activo: false);
        var repo = new HorarioRepository(context);

        (await repo.ExisteEtiquetaActivaAsync("8 San Patricio", null)).Should().BeFalse();
    }

    [Fact]
    public async Task Desactivar_NoBorraElHorarioNiSusAsignaciones()
    {
        await using var context = CrearContexto();
        var horario = await AgregarAsync(context, "8 San Patricio", 1);
        context.PasajeroHorarios.Add(new PasajeroHorario(pasajeroId: 1, horarioId: horario.Id, esPrincipal: true, prioridad: 1));
        await context.SaveChangesAsync();
        var repo = new HorarioRepository(context);

        horario.Desactivar();
        await repo.UpdateAsync(horario);

        context.Horarios.Count().Should().Be(1);
        context.PasajeroHorarios.Count().Should().Be(1);
        (await repo.GetByIdAsync(horario.Id))!.Activo.Should().BeFalse();
    }

    [Fact]
    public async Task GetSiguienteOrdenAsync_SinHorarios_Devuelve1()
    {
        await using var context = CrearContexto();
        var repo = new HorarioRepository(context);

        (await repo.GetSiguienteOrdenAsync()).Should().Be(1);
    }

    [Fact]
    public async Task GetSiguienteOrdenAsync_ContandoTambienLosInactivos()
    {
        await using var context = CrearContexto();
        await AgregarAsync(context, "8 San Patricio", 4);
        await AgregarAsync(context, "10 Boisdron", 9, activo: false);
        var repo = new HorarioRepository(context);

        (await repo.GetSiguienteOrdenAsync()).Should().Be(10);
    }

    [Fact]
    public async Task AddAsync_GuardaElHorarioNuevoSinTocarLosExistentes()
    {
        await using var context = CrearContexto();
        var existente = await AgregarAsync(context, "8 San Patricio", 1);
        var repo = new HorarioRepository(context);

        await repo.AddAsync(Horario.Crear("9 Boisdron", 2, 2, SentidoHorario.Vuelta));

        context.Horarios.Count().Should().Be(2);
        (await repo.GetByIdAsync(existente.Id))!.Etiqueta.Should().Be("8 San Patricio");
    }

    [Fact]
    public void IHorarioRepository_NoExponeBorradoFisico()
    {
        var nombres = typeof(IHorarioRepository).GetMethods().Select(m => m.Name).ToList();

        nombres.Should().NotContain(n =>
            n.Contains("Delete") || n.Contains("Remove") || n.Contains("Eliminar") || n.Contains("Borrar"),
            "los horarios nunca se borran físicamente: solo se desactivan");
    }
}
