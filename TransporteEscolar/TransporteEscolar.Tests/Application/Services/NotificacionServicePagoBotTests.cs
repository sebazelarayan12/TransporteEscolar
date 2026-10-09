using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Services;

public class NotificacionServicePagoBotTests
{
    private readonly Mock<INotificacionRepository> _repository = new();
    private readonly Mock<IWebPushService> _webPush = new();

    private NotificacionService CrearServicio() =>
        new(_repository.Object, _webPush.Object, NullLogger<NotificacionService>.Instance);

    // ── UnirPeriodos ───────────────────────────────────────────────────────

    [Fact]
    public void UnirPeriodos_SinElementos_DevuelveVacio()
    {
        NotificacionService.UnirPeriodos(Array.Empty<string>()).Should().Be("");
    }

    [Fact]
    public void UnirPeriodos_UnElemento_DevuelveElElemento()
    {
        NotificacionService.UnirPeriodos(new[] { "03/2026" }).Should().Be("03/2026");
    }

    [Fact]
    public void UnirPeriodos_DosElementos_UsaY()
    {
        NotificacionService.UnirPeriodos(new[] { "03/2026", "04/2026" }).Should().Be("03/2026 y 04/2026");
    }

    [Fact]
    public void UnirPeriodos_TresElementos_UsaComaYLaYFinal()
    {
        NotificacionService.UnirPeriodos(new[] { "03/2026", "04/2026", "05/2026" })
            .Should().Be("03/2026, 04/2026 y 05/2026");
    }

    [Fact]
    public void UnirPeriodos_CuatroElementos_UsaComaYLaYFinal()
    {
        NotificacionService.UnirPeriodos(new[] { "01/2026", "02/2026", "03/2026", "04/2026" })
            .Should().Be("01/2026, 02/2026, 03/2026 y 04/2026");
    }

    // ── CrearNotificacionPagoBotAsync ──────────────────────────────────────

    [Fact]
    public async Task CrearNotificacionPagoBotAsync_GuardaNotificacionConPeriodosCubiertos()
    {
        Notificacion? guardada = null;
        _repository
            .Setup(r => r.AddAsync(It.IsAny<Notificacion>(), It.IsAny<CancellationToken>()))
            .Callback<Notificacion, CancellationToken>((n, _) => guardada = n)
            .ReturnsAsync((Notificacion n, CancellationToken _) => n);

        var servicio = CrearServicio();
        await servicio.CrearNotificacionPagoBotAsync("Pérez", 45000m, new[] { "03/2026", "04/2026" }, 77);

        var mensajeEsperado = $"Pérez pagó ${45000m:N0} (03/2026 y 04/2026)";
        guardada.Should().NotBeNull();
        guardada!.Tipo.Should().Be("PAGO_REGISTRADO");
        guardada.Titulo.Should().Be("Nuevo pago registrado");
        guardada.Mensaje.Should().Be(mensajeEsperado);
        guardada.EntidadTipo.Should().Be("PagoMensual");
        guardada.EntidadId.Should().Be(77);
    }

    [Fact]
    public async Task CrearNotificacionPagoBotAsync_EnviaPushSinPeriodoUnaVez()
    {
        var servicio = CrearServicio();
        await servicio.CrearNotificacionPagoBotAsync("Pérez", 45000m, new[] { "03/2026", "04/2026" }, 77);

        var mensajeEsperado = $"Pérez pagó ${45000m:N0} (03/2026 y 04/2026)";
        _webPush.Verify(
            w => w.EnviarATodosSinPeriodoAsync(
                "Nuevo pago registrado",
                mensajeEsperado,
                "/pagos?pagoId=77",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CrearNotificacionPagoBotAsync_NoUsaLaVarianteQueNormalizaElPeriodo()
    {
        var servicio = CrearServicio();
        await servicio.CrearNotificacionPagoBotAsync("Pérez", 45000m, new[] { "03/2026" }, 77);

        _webPush.Verify(
            w => w.EnviarATodosAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CrearNotificacionPagoBotAsync_SiElPushFalla_NoLanzaExcepcion()
    {
        _webPush
            .Setup(w => w.EnviarATodosSinPeriodoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("push caído"));

        var servicio = CrearServicio();

        var accion = () => servicio.CrearNotificacionPagoBotAsync("Pérez", 45000m, new[] { "03/2026" }, 77);

        await accion.Should().NotThrowAsync();
    }

    // ── CrearNotificacionPagoRegistradoAsync (existente, sin cambios) ──────

    [Fact]
    public async Task CrearNotificacionPagoRegistradoAsync_SigueUsandoEnviarATodosAsync()
    {
        var servicio = CrearServicio();
        await servicio.CrearNotificacionPagoRegistradoAsync("Pérez", 45000m, "03/2026", 77);

        _webPush.Verify(
            w => w.EnviarATodosAsync(
                "Nuevo pago registrado",
                $"Pérez pagó ${45000m:N0} (03/2026)",
                "/pagos?pagoId=77",
                It.IsAny<CancellationToken>()),
            Times.Once);

        _webPush.Verify(
            w => w.EnviarATodosSinPeriodoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
