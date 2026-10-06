using FluentAssertions;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Tests.Application.Services;

public class HorarioServiceTests
{
    private readonly Mock<IHorarioRepository> _horarios = new();
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<IPasajeroHorarioRepository> _pasajeroHorarios = new();
    private readonly Mock<IColegioRepository> _colegios = new();

    private HorarioService CrearServicio() =>
        new(_horarios.Object, _pasajeros.Object, _pasajeroHorarios.Object, _colegios.Object);

    private static Horario CrearHorario(int id, string etiqueta, int colegioId = 1, SentidoHorario sentido = SentidoHorario.Ida)
    {
        var horario = Horario.Crear(etiqueta, id, colegioId, sentido);
        typeof(Horario).GetProperty(nameof(Horario.Id))!.SetValue(horario, id);
        return horario;
    }

    private static Colegio CrearColegio(bool activo = true)
    {
        var colegio = new Colegio("San Patricio", "Dirección", -26.8, -65.2);
        if (!activo) colegio.Desactivar();
        return colegio;
    }

    private void ConPasajerosActivos(int horarioId, int cantidad)
    {
        _pasajeros
            .Setup(r => r.GetActivosCountByHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, ConteoPorTransporte> { [horarioId] = new(cantidad, 0) });
    }

    private void SinPasajerosActivos()
    {
        _pasajeros
            .Setup(r => r.GetActivosCountByHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<int, ConteoPorTransporte>());
    }

    private void HorarioExistente(Horario horario)
    {
        _horarios.Setup(r => r.GetByIdAsync(horario.Id, It.IsAny<CancellationToken>())).ReturnsAsync(horario);
    }

    // ── Listado ────────────────────────────────────────────────────────────

    [Fact]
    public async Task ObtenerHorariosAsync_PorDefectoUsaSoloLosActivos()
    {
        SinPasajerosActivos();
        _horarios.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio") });

        var resultado = await CrearServicio().ObtenerHorariosAsync();

        resultado.Should().ContainSingle();
        _horarios.Verify(r => r.GetTodosAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ObtenerHorariosAsync_ConIncluirInactivosUsaTodos_YExponeActivoYColegio()
    {
        SinPasajerosActivos();
        var inactivo = CrearHorario(2, "10 Boisdron", colegioId: 2);
        inactivo.Desactivar();
        _horarios.Setup(r => r.GetTodosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio"), inactivo });

        var resultado = await CrearServicio().ObtenerHorariosAsync(incluirInactivos: true);

        resultado.Should().HaveCount(2);
        resultado.Single(h => h.Id == 2).Activo.Should().BeFalse();
        resultado.Single(h => h.Id == 2).ColegioId.Should().Be(2);
        _horarios.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── Crear ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task CrearAsync_ConOrden_GuardaElHorarioNuevo()
    {
        _colegios.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio());
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync("14 Boisdron Entrada", null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        Horario? guardado = null;
        _horarios.Setup(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()))
            .Callback<Horario, CancellationToken>((h, _) =>
            {
                typeof(Horario).GetProperty(nameof(Horario.Id))!.SetValue(h, 10);
                guardado = h;
            })
            .Returns(Task.CompletedTask);
        _horarios.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(() => guardado);
        SinPasajerosActivos();

        var resultado = await CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest("  14 Boisdron Entrada ", 7, 2, SentidoHorario.Ida));

        resultado.Etiqueta.Should().Be("14 Boisdron Entrada");
        resultado.Orden.Should().Be(7);
        resultado.ColegioId.Should().Be(2);
        resultado.Sentido.Should().Be("Ida");
        resultado.Activo.Should().BeTrue();
        resultado.PasajerosActivos.Should().Be(0);
        _horarios.Verify(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Once);
        _horarios.Verify(r => r.GetSiguienteOrdenAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CrearAsync_SinOrden_UsaElSiguiente()
    {
        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio());
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync(It.IsAny<string>(), null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _horarios.Setup(r => r.GetSiguienteOrdenAsync(It.IsAny<CancellationToken>())).ReturnsAsync(10);
        Horario? guardado = null;
        _horarios.Setup(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()))
            .Callback<Horario, CancellationToken>((h, _) => guardado = h)
            .Returns(Task.CompletedTask);
        _horarios.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(() => guardado);
        SinPasajerosActivos();

        var resultado = await CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest("14 Boisdron", null, 1, SentidoHorario.Vuelta));

        resultado.Orden.Should().Be(10);
    }

    [Fact]
    public async Task CrearAsync_EtiquetaDuplicada_LanzaYNoGuarda()
    {
        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio());
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync("8 San Patricio", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var accion = () => CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest("8 San Patricio", null, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>().WithMessage("*8 San Patricio*");
        _horarios.Verify(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CrearAsync_ColegioInexistente_LanzaYNoGuarda()
    {
        _colegios.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync((Colegio?)null);

        var accion = () => CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest("8 Nuevo", null, 5, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>();
        _horarios.Verify(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CrearAsync_ColegioInactivo_LanzaYNoGuarda()
    {
        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio(activo: false));

        var accion = () => CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest("8 Nuevo", null, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>();
        _horarios.Verify(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("San Patricio")]
    [InlineData("")]
    [InlineData("25 San Patricio")]
    public async Task CrearAsync_EtiquetaInvalida_LanzaYNoGuarda(string etiqueta)
    {
        var accion = () => CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest(etiqueta, null, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>();
        _horarios.Verify(r => r.AddAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CrearAsync_OrdenMenorAUno_Lanza()
    {
        var accion = () => CrearServicio().CrearAsync(
            new HorarioModel.CrearRequest("8 San Patricio", 0, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task CrearAsync_RequestNulo_Lanza()
    {
        var accion = () => CrearServicio().CrearAsync(null!);

        await accion.Should().ThrowAsync<ValidationException>();
    }

    // ── Actualizar ─────────────────────────────────────────────────────────

    [Fact]
    public async Task ActualizarAsync_CambiaEtiquetaYOrden_AunConPasajerosActivos()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        HorarioExistente(horario);
        ConPasajerosActivos(1, 5);
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync("8:15 San Patricio", 1, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var resultado = await CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("8:15 San Patricio", 4, 1, SentidoHorario.Ida));

        resultado.Etiqueta.Should().Be("8:15 San Patricio");
        resultado.Orden.Should().Be(4);
        _horarios.Verify(r => r.UpdateAsync(horario, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ActualizarAsync_CambiarColegioConPasajerosActivos_LanzaYNoGuarda()
    {
        var horario = CrearHorario(1, "8 San Patricio", colegioId: 1);
        HorarioExistente(horario);
        ConPasajerosActivos(1, 3);

        var accion = () => CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("8 San Patricio", 1, 2, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<BusinessRuleException>().WithMessage("*3*");
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
        horario.ColegioId.Should().Be(1);
    }

    [Fact]
    public async Task ActualizarAsync_CambiarSentidoConPasajerosActivos_LanzaYNoGuarda()
    {
        var horario = CrearHorario(1, "8 San Patricio", sentido: SentidoHorario.Ida);
        HorarioExistente(horario);
        ConPasajerosActivos(1, 1);

        var accion = () => CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("8 San Patricio", 1, 1, SentidoHorario.Vuelta));

        await accion.Should().ThrowAsync<BusinessRuleException>();
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
        horario.Sentido.Should().Be(SentidoHorario.Ida);
    }

    [Fact]
    public async Task ActualizarAsync_CambiarColegioSinPasajeros_ValidaQueElColegioEsteActivo()
    {
        var horario = CrearHorario(1, "8 San Patricio", colegioId: 1);
        HorarioExistente(horario);
        SinPasajerosActivos();
        _colegios.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio(activo: false));

        var accion = () => CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("8 San Patricio", 1, 2, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>();
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ActualizarAsync_CambiarColegioSinPasajeros_Guarda()
    {
        var horario = CrearHorario(1, "8 San Patricio", colegioId: 1);
        HorarioExistente(horario);
        SinPasajerosActivos();
        _colegios.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio());

        var resultado = await CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("8 San Patricio", 1, 2, SentidoHorario.Ida));

        resultado.ColegioId.Should().Be(2);
        _horarios.Verify(r => r.UpdateAsync(horario, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ActualizarAsync_EtiquetaDuplicadaEnOtroHorarioActivo_Lanza()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        HorarioExistente(horario);
        SinPasajerosActivos();
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync("9 Boisdron", 1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var accion = () => CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("9 Boisdron", 1, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>().WithMessage("*9 Boisdron*");
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ActualizarAsync_HorarioInexistente_LanzaNotFound()
    {
        _horarios.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((Horario?)null);

        var accion = () => CrearServicio().ActualizarAsync(
            99, new HorarioModel.ActualizarRequest("8 San Patricio", 1, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ActualizarAsync_EtiquetaConFormatoInvalido_LanzaYNoGuarda()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        HorarioExistente(horario);

        var accion = () => CrearServicio().ActualizarAsync(
            1, new HorarioModel.ActualizarRequest("San Patricio", 1, 1, SentidoHorario.Ida));

        await accion.Should().ThrowAsync<ValidationException>();
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── Desactivar ─────────────────────────────────────────────────────────

    [Fact]
    public async Task DesactivarAsync_ConPasajerosActivos_LanzaYNoDesactiva()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        HorarioExistente(horario);
        ConPasajerosActivos(1, 4);

        var accion = () => CrearServicio().DesactivarAsync(1);

        await accion.Should().ThrowAsync<BusinessRuleException>().WithMessage("*4*");
        horario.Activo.Should().BeTrue();
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DesactivarAsync_SinPasajeros_DesactivaYGuarda()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        HorarioExistente(horario);
        SinPasajerosActivos();

        await CrearServicio().DesactivarAsync(1);

        horario.Activo.Should().BeFalse();
        _horarios.Verify(r => r.UpdateAsync(horario, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DesactivarAsync_YaInactivo_NoHaceNada()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        horario.Desactivar();
        HorarioExistente(horario);

        await CrearServicio().DesactivarAsync(1);

        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DesactivarAsync_HorarioInexistente_LanzaNotFound()
    {
        _horarios.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>())).ReturnsAsync((Horario?)null);

        var accion = () => CrearServicio().DesactivarAsync(99);

        await accion.Should().ThrowAsync<NotFoundException>();
    }

    // ── Asignar pasajeros ──────────────────────────────────────────────────

    [Fact]
    public async Task AsignarPasajerosAsync_ConHorarioInactivo_LanzaYNoAsigna()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        horario.Desactivar();
        HorarioExistente(horario);

        var accion = () => CrearServicio().AsignarPasajerosAsync(
            1, new HorarioModel.AsignacionRequest(PasajeroIds: new List<int> { 1 }));

        await accion.Should().ThrowAsync<ValidationException>().WithMessage("*inactivo*");
        _pasajeros.Verify(r => r.GetByIdsAsync(It.IsAny<IEnumerable<int>>(), It.IsAny<CancellationToken>()), Times.Never);
        _pasajeroHorarios.Verify(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── Reactivar ──────────────────────────────────────────────────────────

    [Fact]
    public async Task ReactivarAsync_ReactivaYGuarda()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        horario.Desactivar();
        HorarioExistente(horario);
        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio());
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync("8 San Patricio", 1, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        await CrearServicio().ReactivarAsync(1);

        horario.Activo.Should().BeTrue();
        _horarios.Verify(r => r.UpdateAsync(horario, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReactivarAsync_ConEtiquetaYaTomadaPorUnActivo_LanzaYNoReactiva()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        horario.Desactivar();
        HorarioExistente(horario);
        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio());
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync("8 San Patricio", 1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var accion = () => CrearServicio().ReactivarAsync(1);

        await accion.Should().ThrowAsync<ValidationException>();
        horario.Activo.Should().BeFalse();
        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReactivarAsync_ConColegioInactivo_LanzaYNoReactiva()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        horario.Desactivar();
        HorarioExistente(horario);
        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(CrearColegio(activo: false));
        _horarios.Setup(r => r.ExisteEtiquetaActivaAsync(It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var accion = () => CrearServicio().ReactivarAsync(1);

        await accion.Should().ThrowAsync<BusinessRuleException>();
        horario.Activo.Should().BeFalse();
    }

    [Fact]
    public async Task ReactivarAsync_YaActivo_NoHaceNada()
    {
        var horario = CrearHorario(1, "8 San Patricio");
        HorarioExistente(horario);

        await CrearServicio().ReactivarAsync(1);

        _horarios.Verify(r => r.UpdateAsync(It.IsAny<Horario>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
