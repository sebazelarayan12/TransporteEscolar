using FluentAssertions;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Validation;

namespace TransporteEscolar.Tests.Application.Validation;

public class PagoMensualValidatorTests
{
    // ── Validate (Request) ───────────────────────────────────────────────────

    [Fact]
    public void Validate_RequestValida_NoLanzaExcepcion()
    {
        var req = new PagoMensualModel.Request(TitularId: 1, Mes: 6, Anio: 2025, MontoGenerado: 10000m, Observaciones: null);
        var act = () => PagoMensualValidator.Validate(req);
        act.Should().NotThrow();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_TitularIdInvalido_LanzaValidationException(int titularId)
    {
        var req = new PagoMensualModel.Request(titularId, 6, 2025, 10000m, null);
        var act = () => PagoMensualValidator.Validate(req);
        act.Should().Throw<ValidationException>().WithMessage("*TitularId*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    [InlineData(-1)]
    public void Validate_MesInvalido_LanzaValidationException(int mes)
    {
        var req = new PagoMensualModel.Request(1, mes, 2025, 10000m, null);
        var act = () => PagoMensualValidator.Validate(req);
        act.Should().Throw<ValidationException>().WithMessage("*mes*");
    }

    [Theory]
    [InlineData(2019)]
    [InlineData(2101)]
    public void Validate_AnioInvalido_LanzaValidationException(int anio)
    {
        var req = new PagoMensualModel.Request(1, 6, anio, 10000m, null);
        var act = () => PagoMensualValidator.Validate(req);
        act.Should().Throw<ValidationException>().WithMessage("*nv*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Validate_MontoInvalido_LanzaValidationException(decimal monto)
    {
        var req = new PagoMensualModel.Request(1, 6, 2025, monto, null);
        var act = () => PagoMensualValidator.Validate(req);
        act.Should().Throw<ValidationException>().WithMessage("*monto*");
    }

    // ── ValidateRegistrarPago ────────────────────────────────────────────────

    [Fact]
    public void ValidateRegistrarPago_Valido_NoLanzaExcepcion()
    {
        var req = new PagoMensualModel.RegistrarPagoRequest(5000m, DateTimeOffset.UtcNow, "Efectivo", null);
        var act = () => PagoMensualValidator.ValidateRegistrarPago(req);
        act.Should().NotThrow();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ValidateRegistrarPago_MontoInvalido_LanzaValidationException(decimal monto)
    {
        var req = new PagoMensualModel.RegistrarPagoRequest(monto, DateTimeOffset.UtcNow, "Efectivo", null);
        var act = () => PagoMensualValidator.ValidateRegistrarPago(req);
        act.Should().Throw<ValidationException>().WithMessage("*monto*");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ValidateRegistrarPago_MedioPagoVacio_LanzaValidationException(string? medioPago)
    {
        var req = new PagoMensualModel.RegistrarPagoRequest(5000m, DateTimeOffset.UtcNow, medioPago!, null);
        var act = () => PagoMensualValidator.ValidateRegistrarPago(req);
        act.Should().Throw<ValidationException>().WithMessage("*medio de pago*");
    }

    // ── ValidateAjusteTitular ────────────────────────────────────────────────

    [Fact]
    public void ValidateAjusteTitular_Valido_NoLanzaExcepcion()
    {
        var req = new PagoMensualModel.AjusteTitularRequest(12000m, true, "aumento");
        var act = () => PagoMensualValidator.ValidateAjusteTitular(req);
        act.Should().NotThrow();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-500)]
    public void ValidateAjusteTitular_NuevoMontoInvalido_LanzaValidationException(decimal monto)
    {
        var req = new PagoMensualModel.AjusteTitularRequest(monto);
        var act = () => PagoMensualValidator.ValidateAjusteTitular(req);
        act.Should().Throw<ValidationException>().WithMessage("*monto*");
    }

    [Fact]
    public void ValidateAjusteTitular_MotivoMasDe200Chars_LanzaValidationException()
    {
        var motivo = new string('x', 201);
        var req = new PagoMensualModel.AjusteTitularRequest(10000m, true, motivo);
        var act = () => PagoMensualValidator.ValidateAjusteTitular(req);
        act.Should().Throw<ValidationException>().WithMessage("*200 caracteres*");
    }

    [Fact]
    public void ValidateAjusteTitular_Motivo200Chars_NoLanzaExcepcion()
    {
        var motivo = new string('x', 200);
        var req = new PagoMensualModel.AjusteTitularRequest(10000m, true, motivo);
        var act = () => PagoMensualValidator.ValidateAjusteTitular(req);
        act.Should().NotThrow();
    }
}
