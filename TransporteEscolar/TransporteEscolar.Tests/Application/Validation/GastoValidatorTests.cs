using FluentAssertions;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Validation;

namespace TransporteEscolar.Tests.Application.Validation;

public class GastoValidatorTests
{
    private static GastoModel.GastoVariableRequest Gasto(string? vehiculo) =>
        new(10, 2026, "Combustible", "Nafta", 4500m, new DateOnly(2026, 10, 8), "Efectivo", "Pagado", null, vehiculo);

    // Regresión: el botón "Otro" del front manda cualquier nombre de vehículo y el backend lo rechazaba
    // con "vehiculo debe ser Ducato o Sprinter." (no se podía anotar combustible de la moto ni del auto).
    [Theory]
    [InlineData("Ducato")]
    [InlineData("Sprinter")]
    [InlineData("Moto")]
    [InlineData("Auto")]
    [InlineData("  Camioneta de papá  ")]
    public void ValidateGastoVariable_AceptaCualquierNombreDeVehiculo(string vehiculo)
    {
        var accion = () => GastoValidator.ValidateGastoVariable(Gasto(vehiculo));

        accion.Should().NotThrow();
    }

    [Fact]
    public void ValidateGastoVariable_SinVehiculo_EsValido()
    {
        var accion = () => GastoValidator.ValidateGastoVariable(Gasto(null));

        accion.Should().NotThrow();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateGastoVariable_VehiculoEnBlanco_Lanza(string vehiculo)
    {
        var accion = () => GastoValidator.ValidateGastoVariable(Gasto(vehiculo));

        accion.Should().Throw<ValidationException>().WithMessage("vehiculo no puede estar vacío.");
    }

    [Fact]
    public void ValidateGastoVariable_VehiculoMuyLargo_Lanza()
    {
        var accion = () => GastoValidator.ValidateGastoVariable(Gasto(new string('a', 61)));

        accion.Should().Throw<ValidationException>().WithMessage("vehiculo supera el máximo de 60 caracteres.");
    }

    [Fact]
    public void ValidateGastoVariable_VehiculoDeExactamente60Caracteres_EsValido()
    {
        var accion = () => GastoValidator.ValidateGastoVariable(Gasto(new string('a', 60)));

        accion.Should().NotThrow();
    }

    [Theory]
    [InlineData("ducato", "Ducato")]
    [InlineData("DUCATO", "Ducato")]
    [InlineData(" sprinter ", "Sprinter")]
    [InlineData("Moto", "Moto")]
    [InlineData("  Auto  ", "Auto")]
    public void NormalizarVehiculo_UnificaLosConocidosYRecortaElResto(string entrada, string esperado)
    {
        GastoValidator.NormalizarVehiculo(entrada).Should().Be(esperado);
    }

    [Fact]
    public void NormalizarVehiculo_Null_DevuelveNull()
    {
        GastoValidator.NormalizarVehiculo(null).Should().BeNull();
    }
}
