using FluentAssertions;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Tests.Domain;

public class HorarioActivoTests
{
    [Fact]
    public void Constructor_CreaElHorarioActivo()
    {
        var horario = new Horario("8 San Patricio", 1);

        horario.Activo.Should().BeTrue();
    }

    [Fact]
    public void Desactivar_MarcaElHorarioComoInactivo()
    {
        var horario = new Horario("8 San Patricio", 1);

        horario.Desactivar();

        horario.Activo.Should().BeFalse();
    }

    [Fact]
    public void Reactivar_DevuelveElHorarioAActivo()
    {
        var horario = new Horario("8 San Patricio", 1);
        horario.Desactivar();

        horario.Reactivar();

        horario.Activo.Should().BeTrue();
    }

    [Fact]
    public void Desactivar_NoCambiaLosDemasDatos()
    {
        var horario = Horario.Crear("9 Boisdron", 3, 2, SentidoHorario.Vuelta);

        horario.Desactivar();

        horario.Etiqueta.Should().Be("9 Boisdron");
        horario.Orden.Should().Be(3);
        horario.ColegioId.Should().Be(2);
        horario.Sentido.Should().Be(SentidoHorario.Vuelta);
    }

    [Fact]
    public void Crear_AsignaTodosLosCampos()
    {
        var horario = Horario.Crear("  13:30 Boisdron Salida ", 7, 2, SentidoHorario.Vuelta);

        horario.Etiqueta.Should().Be("13:30 Boisdron Salida");
        horario.Orden.Should().Be(7);
        horario.ColegioId.Should().Be(2);
        horario.Sentido.Should().Be(SentidoHorario.Vuelta);
        horario.Activo.Should().BeTrue();
    }

    [Fact]
    public void Crear_ConEtiquetaVacia_Lanza()
    {
        var accion = () => Horario.Crear("  ", 1, 1, SentidoHorario.Ida);

        accion.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Crear_ConColegioInvalido_Lanza(int colegioId)
    {
        var accion = () => Horario.Crear("8 San Patricio", 1, colegioId, SentidoHorario.Ida);

        accion.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Crear_ConSentidoInexistente_Lanza()
    {
        var accion = () => Horario.Crear("8 San Patricio", 1, 1, (SentidoHorario)99);

        accion.Should().Throw<ArgumentOutOfRangeException>();
    }
}
