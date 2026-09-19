using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class HorarioColegioTests
{
    [Fact]
    public void Constructor_NoAsignaColegioPorDefecto()
    {
        var horario = new Horario("8 San Patricio", 1);

        horario.ColegioId.Should().BeNull();
    }

    [Fact]
    public void AsignarColegio_GuardaElId()
    {
        var horario = new Horario("8 San Patricio", 1);

        horario.AsignarColegio(1);

        horario.ColegioId.Should().Be(1);
    }

    [Fact]
    public void AsignarColegio_ConNull_DesvinculaElColegio()
    {
        var horario = new Horario("8 San Patricio", 1);
        horario.AsignarColegio(1);

        horario.AsignarColegio(null);

        horario.ColegioId.Should().BeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public void AsignarColegio_ConIdInvalido_Lanza(int colegioId)
    {
        var horario = new Horario("8 San Patricio", 1);

        var accion = () => horario.AsignarColegio(colegioId);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("colegioId");
    }
}
