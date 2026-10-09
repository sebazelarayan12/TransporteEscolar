using FluentAssertions;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Validation;

namespace TransporteEscolar.Tests.Application.Validation;

public class BotPagoValidatorTests
{
    private static readonly DateOnly Hoy = new(2026, 10, 8);

    private static BotPagoModel.RegistrarRequest Registro(
        string? mensajeId = "msg-1",
        int? titularId = 1,
        string? monto = "150000.00",
        string? medioPago = "Efectivo",
        string? fecha = "2026-10-08") =>
        new(mensajeId, titularId, monto, medioPago, fecha);

    private static BotPagoModel.SimularRequest Simulacion(int? titularId = 1, string? monto = "150000.00") =>
        new(titularId, monto);

    [Fact]
    public void ValidarRegistro_pedido_valido_devuelve_los_datos_normalizados()
    {
        var datos = BotPagoValidator.ValidarRegistro(
            Registro(medioPago: "efectivo", monto: "150000.00"), Hoy);

        datos.MensajeId.Should().Be("msg-1");
        datos.TitularId.Should().Be(1);
        datos.Monto.Should().Be(150000m);
        datos.MedioPago.Should().Be("Efectivo");
        datos.Fecha.Should().Be(Hoy);
    }

    [Theory]
    [InlineData("2026-10-08")]
    [InlineData("2026-10-07")]
    public void ValidarRegistro_fecha_hoy_o_ayer_es_valida(string fecha)
    {
        var datos = BotPagoValidator.ValidarRegistro(Registro(fecha: fecha), Hoy);

        datos.Fecha.ToString("yyyy-MM-dd").Should().Be(fecha);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("150,00")]
    [InlineData("150.000,00")]
    [InlineData(" 150000 ")]
    [InlineData("0")]
    [InlineData("10000000.01")]
    public void ValidarRegistro_monto_invalido_lanza_ValidationException(string? monto)
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(monto: monto), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("monto*");
    }

    [Theory]
    [InlineData("Cheque")]
    [InlineData("")]
    [InlineData(null)]
    public void ValidarRegistro_medioPago_fuera_de_lista_lanza_ValidationException(string? medioPago)
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(medioPago: medioPago), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("medioPago*");
    }

    [Theory]
    [InlineData("2026-10-09")]
    [InlineData("08/10/2026")]
    [InlineData(null)]
    public void ValidarRegistro_fecha_invalida_o_futura_lanza_ValidationException(string? fecha)
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(fecha: fecha), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("fecha*");
    }

    [Fact]
    public void ValidarRegistro_titularId_null_lanza_titularId_es_requerido()
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(titularId: null), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("titularId es requerido.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ValidarRegistro_titularId_no_positivo_lanza_titularId_invalido(int titularId)
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(titularId: titularId), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("titularId inválido.");
    }

    [Fact]
    public void ValidarRegistro_mensajeId_vacio_lanza_ValidationException()
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(mensajeId: "   "), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("mensajeId es requerido.");
    }

    [Fact]
    public void ValidarRegistro_mensajeId_de_201_caracteres_lanza_ValidationException()
    {
        var accion = () => BotPagoValidator.ValidarRegistro(Registro(mensajeId: new string('a', 201)), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("mensajeId supera*");
    }

    [Fact]
    public void ValidarSimulacion_pedido_valido_devuelve_titular_y_monto()
    {
        var (titularId, monto) = BotPagoValidator.ValidarSimulacion(Simulacion(titularId: 7, monto: "150000.50"));

        titularId.Should().Be(7);
        monto.Should().Be(150000.50m);
    }

    [Fact]
    public void ValidarSimulacion_titularId_null_lanza_titularId_es_requerido()
    {
        var accion = () => BotPagoValidator.ValidarSimulacion(Simulacion(titularId: null));

        accion.Should().Throw<ValidationException>().WithMessage("titularId es requerido.");
    }

    [Fact]
    public void ValidarSimulacion_titularId_cero_lanza_titularId_invalido()
    {
        var accion = () => BotPagoValidator.ValidarSimulacion(Simulacion(titularId: 0));

        accion.Should().Throw<ValidationException>().WithMessage("titularId inválido.");
    }

    [Fact]
    public void ValidarSimulacion_monto_con_coma_lanza_ValidationException()
    {
        var accion = () => BotPagoValidator.ValidarSimulacion(Simulacion(monto: "150000,00"));

        accion.Should().Throw<ValidationException>().WithMessage("monto*");
    }
}
