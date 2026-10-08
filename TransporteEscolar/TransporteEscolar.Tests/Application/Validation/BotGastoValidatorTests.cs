using FluentAssertions;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Validation;

namespace TransporteEscolar.Tests.Application.Validation;

public class BotGastoValidatorTests
{
    private static readonly DateOnly Hoy = new(2026, 10, 8);

    private static BotGastoModel.RegistrarRequest Pedido(
        string? mensajeId = "msg-1",
        string? monto = "4500.00",
        string? categoria = "Otros",
        string? medioPago = "Efectivo",
        string? estado = "Pagado",
        string? fecha = "2026-10-08",
        string? descripcion = "Gasto de prueba",
        string? vehiculo = null) =>
        new(mensajeId, monto, categoria, medioPago, estado, fecha, descripcion, vehiculo);

    [Theory]
    [InlineData("4500", 4500)]
    [InlineData("4500.5", 4500.5)]
    [InlineData("4500.50", 4500.5)]
    [InlineData("0.01", 0.01)]
    [InlineData("10000000", 10000000)]
    public void Monto_valido_se_parsea(string monto, double esperado)
    {
        var datos = BotGastoValidator.Validar(Pedido(monto: monto), Hoy);

        datos.Monto.Should().Be((decimal)esperado);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("4,500")]
    [InlineData("4.500,50")]
    [InlineData("1.500.000")]
    [InlineData("4500.123")]
    [InlineData("-5")]
    [InlineData("0")]
    [InlineData("0.00")]
    [InlineData("10000000.01")]
    [InlineData("12345678901")]
    [InlineData(" 4500 ")]
    [InlineData("4500\n")]
    public void Monto_invalido_lanza_ValidationException(string? monto)
    {
        var accion = () => BotGastoValidator.Validar(Pedido(monto: monto), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("monto*");
    }

    [Fact]
    public void Monto_con_espacios_se_rechaza_sin_recortar()
    {
        // Decisión: el monto es estricto, no se recorta. El bot manda el valor ya limpio.
        var accion = () => BotGastoValidator.Validar(Pedido(monto: " 4500 "), Hoy);

        accion.Should().Throw<ValidationException>()
            .WithMessage("monto inválido: usá punto decimal y hasta 2 decimales.");
    }

    [Theory]
    [InlineData("combustible", "Combustible")]
    [InlineData("COMBUSTIBLE", "Combustible")]
    [InlineData("viajeseventos", "ViajesEventos")]
    [InlineData("SERVICIOSPUBLICOS", "ServiciosPublicos")]
    [InlineData("Otros", "Otros")]
    public void Categoria_valida_devuelve_la_grafia_canonica(string categoria, string esperada)
    {
        var datos = BotGastoValidator.Validar(Pedido(categoria: categoria), Hoy);

        datos.Categoria.Should().Be(esperada);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Peaje")]
    public void Categoria_invalida_lanza_ValidationException(string? categoria)
    {
        var accion = () => BotGastoValidator.Validar(Pedido(categoria: categoria), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("categoria*");
    }

    [Fact]
    public void Categoria_no_valida_lista_las_opciones()
    {
        var accion = () => BotGastoValidator.Validar(Pedido(categoria: "Peaje"), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage(
            "categoria no válida. Opciones: Combustible, Mantenimiento, Alimentacion, ViajesEventos, Tarjeta, ServiciosPublicos, Otros.");
    }

    [Theory]
    [InlineData("efectivo", "Efectivo")]
    [InlineData("TRANSFERENCIA", "Transferencia")]
    [InlineData("tarjeta", "Tarjeta")]
    public void MedioPago_valido_devuelve_la_grafia_canonica(string medioPago, string esperado)
    {
        var datos = BotGastoValidator.Validar(Pedido(medioPago: medioPago), Hoy);

        datos.MedioPago.Should().Be(esperado);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Cheque")]
    public void MedioPago_invalido_lanza_ValidationException(string? medioPago)
    {
        var accion = () => BotGastoValidator.Validar(Pedido(medioPago: medioPago), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("medioPago*");
    }

    [Theory]
    [InlineData("pagado", "Pagado")]
    [InlineData("PENDIENTE", "Pendiente")]
    public void Estado_valido_devuelve_la_grafia_canonica(string estado, string esperado)
    {
        var datos = BotGastoValidator.Validar(Pedido(estado: estado), Hoy);

        datos.EstadoPago.Should().Be(esperado);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Cancelado")]
    public void Estado_invalido_lanza_ValidationException(string? estado)
    {
        var accion = () => BotGastoValidator.Validar(Pedido(estado: estado), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("estado*");
    }

    [Theory]
    [InlineData("08/10/2026")]
    [InlineData("2026-13-01")]
    [InlineData("")]
    [InlineData(null)]
    public void Fecha_con_formato_malo_lanza_ValidationException(string? fecha)
    {
        var accion = () => BotGastoValidator.Validar(Pedido(fecha: fecha), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("fecha*");
    }

    [Fact]
    public void Fecha_futura_lanza_ValidationException()
    {
        var accion = () => BotGastoValidator.Validar(Pedido(fecha: "2026-10-09"), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("fecha no puede ser posterior a hoy.");
    }

    [Fact]
    public void Fecha_de_hoy_es_valida()
    {
        var datos = BotGastoValidator.Validar(Pedido(fecha: "2026-10-08"), Hoy);

        datos.Fecha.Should().Be(new DateOnly(2026, 10, 8));
    }

    [Fact]
    public void Fecha_de_ayer_es_valida()
    {
        var datos = BotGastoValidator.Validar(Pedido(fecha: "2026-10-07"), Hoy);

        datos.Fecha.Should().Be(new DateOnly(2026, 10, 7));
    }

    [Fact]
    public void Descripcion_de_2_caracteres_lanza_ValidationException()
    {
        var accion = () => BotGastoValidator.Validar(Pedido(descripcion: "ab"), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("descripcion*");
    }

    [Fact]
    public void Descripcion_de_3_caracteres_es_valida()
    {
        var datos = BotGastoValidator.Validar(Pedido(descripcion: "abc"), Hoy);

        datos.Descripcion.Should().Be("abc");
    }

    [Fact]
    public void Descripcion_de_301_caracteres_lanza_ValidationException()
    {
        var accion = () => BotGastoValidator.Validar(Pedido(descripcion: new string('a', 301)), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("descripcion*");
    }

    [Fact]
    public void Descripcion_se_recorta()
    {
        var datos = BotGastoValidator.Validar(Pedido(descripcion: "  Nafta Ducato  "), Hoy);

        datos.Descripcion.Should().Be("Nafta Ducato");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MensajeId_vacio_o_nulo_lanza_ValidationException(string? mensajeId)
    {
        var accion = () => BotGastoValidator.Validar(Pedido(mensajeId: mensajeId), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("mensajeId*");
    }

    [Fact]
    public void MensajeId_de_201_caracteres_lanza_ValidationException()
    {
        var accion = () => BotGastoValidator.Validar(Pedido(mensajeId: new string('a', 201)), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("mensajeId*");
    }

    [Fact]
    public void MensajeId_de_200_caracteres_es_valido()
    {
        var datos = BotGastoValidator.Validar(Pedido(mensajeId: new string('a', 200)), Hoy);

        datos.MensajeId.Should().HaveLength(200);
    }

    [Fact]
    public void Vehiculo_con_categoria_distinta_de_Combustible_lanza_ValidationException()
    {
        var accion = () => BotGastoValidator.Validar(Pedido(categoria: "Otros", vehiculo: "Ducato"), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("vehiculo*");
    }

    [Fact]
    public void Vehiculo_conocido_con_Combustible_se_normaliza()
    {
        var datos = BotGastoValidator.Validar(Pedido(categoria: "Combustible", vehiculo: "ducato"), Hoy);

        datos.Vehiculo.Should().Be("Ducato");
    }

    [Fact]
    public void Vehiculo_libre_con_Combustible_se_conserva()
    {
        var datos = BotGastoValidator.Validar(Pedido(categoria: "Combustible", vehiculo: "Moto"), Hoy);

        datos.Vehiculo.Should().Be("Moto");
    }

    [Fact]
    public void Sin_vehiculo_es_valido()
    {
        var datos = BotGastoValidator.Validar(Pedido(categoria: "Combustible", vehiculo: null), Hoy);

        datos.Vehiculo.Should().BeNull();
    }

    [Fact]
    public void Pedido_con_todos_los_campos_nulos_lanza_ValidationException_y_no_NullReference()
    {
        var accion = () => BotGastoValidator.Validar(new BotGastoModel.RegistrarRequest(null, null, null, null, null, null, null, null), Hoy);

        accion.Should().Throw<ValidationException>().WithMessage("mensajeId es requerido.");
    }
}
