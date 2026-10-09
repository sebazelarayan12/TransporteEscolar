using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Application;
using TransporteEscolar.Application.Bot;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Prueba el pipeline HTTP real de <c>/api/bot/pagos</c> con un mini-host (TestServer), en el mismo estilo que
/// <c>BotGastosPipelineTests</c>. Los repositorios y <c>INotificacionService</c> son Mocks; MediatR y la validación son reales.
/// </summary>
public class BotPagosPipelineTests
{
    private const string ClaveBotPagos = "clave-bot-pagos-789";
    private const string ClaveGastos = "clave-bot-gastos-123";
    private const string ClaveInasistencias = "clave-bot-inasistencias-456";
    private const string UrlBase = "/api/bot/pagos";
    private const string MensajeId = "msg-1";
    // Lo que el bot guarda y busca en la base: el hash del id, nunca el id en claro.
    private static readonly string ClaveMensaje = BotMensajeId.Hashear(MensajeId);

    // 2026-10-08 15:00 UTC: solo para los movimientos existentes de los tests; los pedidos usan el reloj real.
    private static readonly DateTimeOffset Ahora = new(2026, 10, 8, 15, 0, 0, TimeSpan.Zero);

    private static readonly TimeZoneInfo ZonaArgentina = TimeZoneInfo.FindSystemTimeZoneById("America/Buenos_Aires");

    /// <summary>Repositorios y servicios mockeados que usa el pipeline de pagos.</summary>
    private sealed class Repositorios
    {
        public Mock<ITitularRepository> Titulares { get; } = new();
        public Mock<IPasajeroRepository> Pasajeros { get; } = new();
        public Mock<IPagoMensualRepository> Pagos { get; } = new();
        public Mock<INotificacionService> Notificaciones { get; } = new();
    }

    /// <summary>Mini-host con controllers del assembly Api, MediatR real y los repositorios mockeados.</summary>
    private sealed class HostDePrueba : IAsyncDisposable
    {
        public IHost Host { get; }
        public HttpClient Cliente { get; }

        public HostDePrueba(
            IDictionary<string, string?> configuracion,
            Repositorios repos,
            ILoggerProvider? proveedorLog = null)
        {
            Host = new HostBuilder()
                .ConfigureAppConfiguration(config =>
                {
                    // Sin entradas ApiClients:* queda "no configurada" (503).
                    config.AddInMemoryCollection(configuracion);
                })
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    if (proveedorLog is not null)
                        logging.AddProvider(proveedorLog);
                })
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices((contexto, services) =>
                    {
                        services.AddControllers()
                            .AddApplicationPart(typeof(BotController).Assembly);
                        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<AssemblyMarker>());
                        services.AddSingleton(repos.Titulares.Object);
                        services.AddSingleton(repos.Pasajeros.Object);
                        services.AddSingleton(repos.Pagos.Object);
                        services.AddSingleton(repos.Notificaciones.Object);
                        // BotGastosController (mismo assembly) pide este repositorio; sus acciones no se ejecutan aquí.
                        services.AddSingleton(Mock.Of<IGastoRepository>());
                        services.AddBotApi(contexto.Configuration);
                    })
                    .Configure(app =>
                    {
                        app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
                        app.UseRouting();
                        app.UseAuthentication();
                        app.UseAuthorization();
                        app.UseEndpoints(endpoints => endpoints.MapControllers());
                    }))
                .Build();

            Host.Start();
            Cliente = Host.GetTestClient();
        }

        public async ValueTask DisposeAsync()
        {
            Cliente.Dispose();
            await Host.StopAsync();
            Host.Dispose();
        }
    }

    /// <summary>Log capturado: mensaje formateado y valores estructurados.</summary>
    private sealed record Registro(string Categoria, string Mensaje, IReadOnlyList<KeyValuePair<string, object?>> Valores);

    private sealed class CapturaLoggerProvider : ILoggerProvider
    {
        public List<Registro> Registros { get; } = new();

        public ILogger CreateLogger(string categoryName) => new CapturaLogger(categoryName, Registros);

        public void Dispose() { }

        private sealed class CapturaLogger(string categoria, List<Registro> registros) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                // Se copian los valores ahora: el state de ASP.NET (HostingRequestStartingLog) es una vista perezosa
                // sobre la petición y falla si se enumera después de que la petición terminó.
                var valores = (state as IReadOnlyList<KeyValuePair<string, object?>>
                               ?? new List<KeyValuePair<string, object?>>()).ToList();
                lock (registros)
                    registros.Add(new Registro(categoria, formatter(state, exception), valores));
            }
        }
    }

    private static Dictionary<string, string?> ClienteConfig(string nombre, string? clave, params string[] scopes)
    {
        var config = new Dictionary<string, string?> { [$"ApiClients:{nombre}:Key"] = clave };
        for (var i = 0; i < scopes.Length; i++)
            config[$"ApiClients:{nombre}:Scopes:{i}"] = scopes[i];
        return config;
    }

    private static Dictionary<string, string?> Unir(params Dictionary<string, string?>[] partes) =>
        partes.SelectMany(p => p).ToDictionary(kv => kv.Key, kv => kv.Value);

    private static Dictionary<string, string?> ConClientesConfigurados() => Unir(
        ClienteConfig("BotPagos", ClaveBotPagos, "bot:pagos"),
        ClienteConfig("BotGastos", ClaveGastos, "bot:gastos"),
        ClienteConfig("BotInasistencias", ClaveInasistencias, "bot:identidad"));

    private static DateOnly HoyEnArgentina() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTime.UtcNow, ZonaArgentina));

    /// <summary>Cuerpo JSON de alta válido por defecto; cada parámetro permite romper un campo a propósito.</summary>
    private static string CuerpoRegistro(
        string? mensajeId = MensajeId,
        object? monto = null,
        string? medioPago = "Efectivo",
        string? fecha = null,
        bool conCargadoPor = false)
    {
        var campos = new Dictionary<string, object?>
        {
            ["mensajeId"] = mensajeId,
            ["titularId"] = 1,
            ["monto"] = monto ?? "150000.00",
            ["medioPago"] = medioPago,
            ["fecha"] = fecha ?? HoyEnArgentina().ToString("yyyy-MM-dd")
        };
        if (conCargadoPor)
            campos["cargadoPor"] = "bot-whatsapp";

        return JsonSerializer.Serialize(campos);
    }

    private static string CuerpoSimulacion(string monto = "150000.00") =>
        JsonSerializer.Serialize(new Dictionary<string, object?> { ["titularId"] = 1, ["monto"] = monto });

    private static Titular CrearTitular(int id = 1)
    {
        var titular = new Titular("Perez", "Ana", "Calle 1", 120000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        return titular;
    }

    private static PagoMensual CrearCuota(int mes, int anio, int id, decimal montoGenerado = 120000m)
    {
        var pago = new PagoMensual(1, mes, anio, montoGenerado);
        typeof(PagoMensual).GetProperty(nameof(PagoMensual.Id))!.SetValue(pago, id);
        return pago;
    }

    /// <summary>Movimiento aplicado a una cuota. Con grupo y creación, es un movimiento del bot.</summary>
    private static PagoMovimiento CrearMovimiento(PagoMensual pago, decimal monto, int id, Guid? grupo = null, DateTime? creadoUtc = null)
    {
        var movimiento = pago.AplicarPago(monto, Ahora, "Efectivo", null);
        if (grupo is not null)
            movimiento.MarcarComoCargadoPorBot(ClaveMensaje, grupo.Value, creadoUtc ?? DateTime.UtcNow);
        typeof(PagoMovimiento).GetProperty(nameof(PagoMovimiento.Id))!.SetValue(movimiento, id);
        typeof(PagoMovimiento).GetProperty(nameof(PagoMovimiento.PagoMensual))!.SetValue(movimiento, pago);
        return movimiento;
    }

    /// <summary>Titular activo 1 con las cuotas dadas, sin movimientos previos del mensaje.</summary>
    private static void PrepararTitularConCuotas(Repositorios repos, params PagoMensual[] cuotas)
    {
        repos.Titulares
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearTitular());
        repos.Pagos
            .Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuotas.ToList());
        repos.Pagos
            .Setup(r => r.GetMovimientosPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento>());
    }

    /// <summary>Alta exitosa: el mensaje es nuevo y el guardado en un solo SaveChanges funciona.</summary>
    private static void PrepararAltaExitosa(Repositorios repos, params PagoMensual[] cuotas)
    {
        PrepararTitularConCuotas(repos, cuotas);
        repos.Pagos
            .Setup(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
    }

    private static async Task<HttpResponseMessage> Enviar(
        HostDePrueba host,
        HttpMethod metodo,
        string url,
        string? clave,
        string? cuerpo = null)
    {
        using var request = new HttpRequestMessage(metodo, url);
        if (clave is not null)
            request.Headers.Add(ApiKeyAuthenticationHandler.HeaderName, clave);
        if (cuerpo is not null)
            request.Content = new StringContent(cuerpo, Encoding.UTF8, "application/json");

        return await host.Cliente.SendAsync(request);
    }

    /// <summary>Envía un alta inválida y comprueba 400 sin tocar la escritura del repositorio.</summary>
    private static async Task AfirmarAltaRechazadaSinEscribir(Repositorios repos, string cuerpo)
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Post, UrlBase, ClaveBotPagos, cuerpo);

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        repos.Pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // Todos los endpoints de /api/bot/pagos, con su verbo y un cuerpo válido cuando lo llevan.
    private static IEnumerable<(HttpMethod Metodo, string Url, string? Cuerpo)> TodosLosEndpoints() =>
    [
        (HttpMethod.Get, $"{UrlBase}/titulares", null),
        (HttpMethod.Get, $"{UrlBase}/titulares/1/cuotas", null),
        (HttpMethod.Post, $"{UrlBase}/simular", CuerpoSimulacion()),
        (HttpMethod.Post, UrlBase, CuerpoRegistro()),
        (HttpMethod.Delete, $"{UrlBase}/{Guid.NewGuid()}", null)
    ];

    // ----- 1. Autenticación -----

    [Fact]
    public async Task TodosLosEndpoints_SinHeader_Devuelven401()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        foreach (var (metodo, url, cuerpo) in TodosLosEndpoints())
        {
            using var respuesta = await Enviar(host, metodo, url, clave: null, cuerpo);
            respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"{metodo} {url} sin clave");
        }
    }

    [Fact]
    public async Task TodosLosEndpoints_ConClaveIncorrecta_Devuelven401()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        foreach (var (metodo, url, cuerpo) in TodosLosEndpoints())
        {
            using var respuesta = await Enviar(host, metodo, url, "clave-inventada", cuerpo);
            respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"{metodo} {url} con clave inválida");
        }
    }

    [Fact]
    public async Task TodosLosEndpoints_SinNingunClienteConfigurado_Devuelven503()
    {
        await using var host = new HostDePrueba(new Dictionary<string, string?>(), new Repositorios());

        foreach (var (metodo, url, cuerpo) in TodosLosEndpoints())
        {
            using var respuesta = await Enviar(host, metodo, url, ClaveBotPagos, cuerpo);
            respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, $"{metodo} {url} sin clientes");
        }
    }

    // ----- 2. Aislamiento de alcances -----

    [Fact]
    public async Task ClaveDeBotGastos_EnTitularesDePagos_Devuelve403()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        using var respuesta = await Enviar(host, HttpMethod.Get, $"{UrlBase}/titulares", ClaveGastos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClaveDeBotInasistencias_EnTitularesDePagos_Devuelve403()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        using var respuesta = await Enviar(host, HttpMethod.Get, $"{UrlBase}/titulares", ClaveInasistencias);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClaveDeBotPagos_EnPostDeGastos_Devuelve403()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        using var respuesta = await Enviar(host, HttpMethod.Post, "/api/bot/gastos", ClaveBotPagos, "{}");

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClaveDeBotPagos_EnTitularPorTelefono_Devuelve403()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        using var respuesta = await Enviar(
            host, HttpMethod.Get, "/api/bot/titular-por-telefono?numero=5490000000000", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ----- 3. Lista de titulares -----

    [Fact]
    public async Task GetTitulares_Devuelve200_SinDireccionNiTelefono()
    {
        var repos = new Repositorios();
        repos.Titulares
            .Setup(r => r.GetActivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular() });
        repos.Pasajeros
            .Setup(r => r.GetNombresActivosPorTitularesAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PasajeroActivoBasico>
            {
                new(10, 1, "Juan"),
                new(11, 1, "Sofi")
            });
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Get, $"{UrlBase}/titulares", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        var texto = await respuesta.Content.ReadAsStringAsync();
        texto.Should().NotContain("direccion").And.NotContain("telefono");

        using var json = JsonDocument.Parse(texto);
        var titular = json.RootElement.EnumerateArray().Single();
        titular.GetProperty("titularId").GetInt32().Should().Be(1);
        // El dominio normaliza el apellido en mayúsculas al crear el titular.
        titular.GetProperty("apellido").GetString().Should().Be("PEREZ");
        titular.GetProperty("nombreContacto").GetString().Should().Be("Ana");
        titular.GetProperty("pasajeros").EnumerateArray().Select(p => p.GetString())
            .Should().Equal("Juan", "Sofi");
    }

    // ----- 4. Cuotas pendientes -----

    [Fact]
    public async Task GetCuotas_Devuelve200_ConLasCuotasOrdenadas()
    {
        var repos = new Repositorios();
        repos.Titulares
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearTitular());
        // Entregadas desordenadas: la respuesta debe salir por año y mes ascendente.
        repos.Pagos
            .Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual>
            {
                CrearCuota(10, 2026, 2),
                CrearCuota(9, 2026, 1)
            });
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Get, $"{UrlBase}/titulares/1/cuotas", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var raiz = json.RootElement;
        raiz.GetProperty("titularId").GetInt32().Should().Be(1);
        raiz.GetProperty("apellido").GetString().Should().Be("PEREZ");
        var cuotas = raiz.GetProperty("cuotas").EnumerateArray().ToList();
        cuotas.Should().HaveCount(2);
        cuotas[0].GetProperty("mes").GetInt32().Should().Be(9);
        cuotas[0].GetProperty("saldoPendiente").GetDecimal().Should().Be(120000m);
        cuotas[1].GetProperty("mes").GetInt32().Should().Be(10);
    }

    [Fact]
    public async Task GetCuotas_TitularInexistente_Devuelve404()
    {
        var repos = new Repositorios();
        repos.Titulares
            .Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Titular?)null);
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Get, $"{UrlBase}/titulares/99/cuotas", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ----- 5. Simulación -----

    [Fact]
    public async Task Simular_Devuelve200_ConElRepartoExacto_SinEscribirNada()
    {
        var repos = new Repositorios();
        PrepararTitularConCuotas(repos, CrearCuota(9, 2026, 1), CrearCuota(10, 2026, 2));
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Post, $"{UrlBase}/simular", ClaveBotPagos, CuerpoSimulacion("150000.00"));

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var raiz = json.RootElement;
        raiz.GetProperty("titularId").GetInt32().Should().Be(1);
        raiz.GetProperty("monto").GetDecimal().Should().Be(150000m);
        var reparto = raiz.GetProperty("reparto").EnumerateArray().ToList();
        reparto.Should().HaveCount(2);
        reparto[0].GetProperty("mes").GetInt32().Should().Be(9);
        reparto[0].GetProperty("aplicado").GetDecimal().Should().Be(120000m);
        reparto[0].GetProperty("saldoRestante").GetDecimal().Should().Be(0m);
        reparto[1].GetProperty("mes").GetInt32().Should().Be(10);
        reparto[1].GetProperty("aplicado").GetDecimal().Should().Be(30000m);
        reparto[1].GetProperty("saldoRestante").GetDecimal().Should().Be(90000m);

        repos.Pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
        repos.Pagos.Verify(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
        repos.Pagos.Verify(r => r.UpdateAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
        repos.Pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
        repos.Notificaciones.Verify(r => r.CrearNotificacionPagoBotAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<IReadOnlyList<string>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Simular_ConSobrante_Devuelve400_SinEscribirNada()
    {
        var repos = new Repositorios();
        PrepararTitularConCuotas(repos, CrearCuota(9, 2026, 1));
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Post, $"{UrlBase}/simular", ClaveBotPagos, CuerpoSimulacion("150000.00"));

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("message").GetString().Should().Contain("Sobrante");

        repos.Pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
        repos.Notificaciones.Verify(r => r.CrearNotificacionPagoBotAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<IReadOnlyList<string>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ----- 6. Alta de pagos -----

    [Fact]
    public async Task PostValido_Devuelve201ConGrupoYMovimientosYMontosCorrectos()
    {
        var repos = new Repositorios();
        PrepararAltaExitosa(repos, CrearCuota(9, 2026, 1), CrearCuota(10, 2026, 2));
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Post, UrlBase, ClaveBotPagos, CuerpoRegistro(monto: "150000.00"));

        respuesta.StatusCode.Should().Be(HttpStatusCode.Created);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var raiz = json.RootElement;
        raiz.GetProperty("grupoId").GetGuid().Should().NotBeEmpty();
        raiz.GetProperty("titularId").GetInt32().Should().Be(1);
        raiz.GetProperty("monto").GetDecimal().Should().Be(150000m);
        var movimientos = raiz.GetProperty("movimientos").EnumerateArray().ToList();
        movimientos.Should().HaveCount(2);
        movimientos[0].GetProperty("mes").GetInt32().Should().Be(9);
        movimientos[0].GetProperty("aplicado").GetDecimal().Should().Be(120000m);
        movimientos[0].GetProperty("saldoRestante").GetDecimal().Should().Be(0m);
        movimientos[1].GetProperty("mes").GetInt32().Should().Be(10);
        movimientos[1].GetProperty("aplicado").GetDecimal().Should().Be(30000m);
        movimientos[1].GetProperty("saldoRestante").GetDecimal().Should().Be(90000m);

        repos.Pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MensajeIdYaExistente_Devuelve200ConLosMovimientosExistentes_SinVolverAGuardar()
    {
        var grupo = Guid.NewGuid();
        var pago = CrearCuota(9, 2026, 1);
        var existente = CrearMovimiento(pago, 120000m, 55, grupo, DateTime.UtcNow.AddMinutes(-5));
        var repos = new Repositorios();
        repos.Pagos
            .Setup(r => r.GetMovimientosPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento> { existente });
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Post, UrlBase, ClaveBotPagos, CuerpoRegistro(monto: "120000.00"));

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("grupoId").GetGuid().Should().Be(grupo);
        json.RootElement.GetProperty("monto").GetDecimal().Should().Be(120000m);

        repos.Pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MontoConComa_Devuelve400_YNoTocaElRepositorio()
    {
        await AfirmarAltaRechazadaSinEscribir(new Repositorios(), CuerpoRegistro(monto: "150000,00"));
    }

    [Fact]
    public async Task MontoComoNumeroJson_Devuelve400_YNoTocaElRepositorio()
    {
        await AfirmarAltaRechazadaSinEscribir(new Repositorios(), CuerpoRegistro(monto: 150000.00m));
    }

    [Fact]
    public async Task MedioPagoInventado_Devuelve400_YNoTocaElRepositorio()
    {
        await AfirmarAltaRechazadaSinEscribir(new Repositorios(), CuerpoRegistro(medioPago: "Bitcoin"));
    }

    [Fact]
    public async Task FechaFutura_Devuelve400_YNoTocaElRepositorio()
    {
        var manana = HoyEnArgentina().AddDays(1).ToString("yyyy-MM-dd");

        await AfirmarAltaRechazadaSinEscribir(new Repositorios(), CuerpoRegistro(fecha: manana));
    }

    [Fact]
    public async Task CuerpoVacio_Devuelve400_YNoTocaElRepositorio()
    {
        await AfirmarAltaRechazadaSinEscribir(new Repositorios(), cuerpo: "");
    }

    [Fact]
    public async Task MontoMayorALaDeuda_Devuelve400_YNoTocaElRepositorio()
    {
        // Deuda de 120000: pagar 150000 deja un excedente que el dominio rechaza.
        var repos = new Repositorios();
        PrepararAltaExitosa(repos, CrearCuota(9, 2026, 1));

        await AfirmarAltaRechazadaSinEscribir(repos, CuerpoRegistro(monto: "150000.00"));
    }

    [Fact]
    public async Task CampoExtraCargadoPor_SeIgnora_Devuelve201()
    {
        var repos = new Repositorios();
        PrepararAltaExitosa(repos, CrearCuota(9, 2026, 1));
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Post, UrlBase, ClaveBotPagos,
            CuerpoRegistro(monto: "120000.00", conCargadoPor: true));

        respuesta.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ----- 7. Anulación (DELETE) -----

    [Fact]
    public async Task DeleteDePagoDelBotReciente_Devuelve204_YEliminaLosMovimientos()
    {
        var grupo = Guid.NewGuid();
        var movimiento = CrearMovimiento(CrearCuota(9, 2026, 1), 120000m, 5, grupo, DateTime.UtcNow);
        var repos = new Repositorios();
        repos.Pagos
            .Setup(r => r.GetMovimientosPorGrupoIdAsync(grupo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento> { movimiento });
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{UrlBase}/{grupo}", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NoContent);
        repos.Pagos.Verify(r => r.EliminarMovimientosAsync(
            It.Is<IReadOnlyCollection<PagoMovimiento>>(m => m.Count == 1), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteDeGrupoInexistente_Devuelve404_YNoEliminaNada()
    {
        var repos = new Repositorios();
        repos.Pagos
            .Setup(r => r.GetMovimientosPorGrupoIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento>());
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{UrlBase}/{Guid.NewGuid()}", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
        repos.Pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteDeMovimientoCargadoDesdeLaApp_Devuelve400_YNoLoElimina()
    {
        var grupo = Guid.NewGuid();
        var deLaApp = CrearMovimiento(CrearCuota(9, 2026, 1), 120000m, 6);
        var repos = new Repositorios();
        repos.Pagos
            .Setup(r => r.GetMovimientosPorGrupoIdAsync(grupo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento> { deLaApp });
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{UrlBase}/{grupo}", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        repos.Pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteFueraDelPlazoDeVeinticuatroHoras_Devuelve400_YNoLoElimina()
    {
        var grupo = Guid.NewGuid();
        var viejo = CrearMovimiento(CrearCuota(9, 2026, 1), 120000m, 7, grupo, DateTime.UtcNow.AddHours(-25));
        var repos = new Repositorios();
        repos.Pagos
            .Setup(r => r.GetMovimientosPorGrupoIdAsync(grupo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento> { viejo });
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{UrlBase}/{grupo}", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        repos.Pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteConGrupoQueNoEsGuid_Devuelve404_PorRuta()
    {
        await using var host = new HostDePrueba(ConClientesConfigurados(), new Repositorios());

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{UrlBase}/no-es-un-guid", ClaveBotPagos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ----- 8. Logs sin secretos ni datos del mensaje -----

    [Fact]
    public async Task PostValido_NiLaClaveNiElMensajeIdAparecenEnLosLogs()
    {
        var captura = new CapturaLoggerProvider();
        var repos = new Repositorios();
        PrepararAltaExitosa(repos, CrearCuota(9, 2026, 1));
        await using var host = new HostDePrueba(ConClientesConfigurados(), repos, captura);

        using var respuesta = await Enviar(host, HttpMethod.Post, UrlBase, ClaveBotPagos, CuerpoRegistro(monto: "120000.00"));
        respuesta.StatusCode.Should().Be(HttpStatusCode.Created);

        // Control: se capturaron logs, así que la ausencia de la clave y del mensajeId no es por falta de logs.
        captura.Registros.Should().NotBeEmpty();
        foreach (var registro in captura.Registros)
        {
            registro.Mensaje.Should().NotContain(ClaveBotPagos).And.NotContain(MensajeId);
            foreach (var (_, valor) in registro.Valores)
                (valor?.ToString() ?? string.Empty).Should().NotContain(ClaveBotPagos).And.NotContain(MensajeId);
        }
    }
}
