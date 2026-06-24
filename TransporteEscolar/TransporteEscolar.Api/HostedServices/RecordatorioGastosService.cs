using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.HostedServices;

public class RecordatorioGastosService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RecordatorioGastosService> _logger;
    private static readonly TimeZoneInfo ZonaArgentina =
        TimeZoneInfo.FindSystemTimeZoneById("America/Buenos_Aires");

    private const int HoraRecordatorio = 20;

    public RecordatorioGastosService(
        IServiceProvider serviceProvider,
        ILogger<RecordatorioGastosService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RecordatorioGastosService iniciado. Hora configurada: {Hora}:00 Argentina",
            HoraRecordatorio);

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = CalcularDelayHastaProximoEnvio();
            _logger.LogInformation("Próximo recordatorio de gastos en {Horas:F1} horas", delay.TotalHours);

            await Task.Delay(delay, stoppingToken);

            try
            {
                await EnviarRecordatorioAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en RecordatorioGastosService");
            }
        }
    }

    private static TimeSpan CalcularDelayHastaProximoEnvio()
    {
        var ahoraArgentina = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ZonaArgentina);
        var proximoEnvio = ahoraArgentina.Date.AddHours(HoraRecordatorio);

        if (ahoraArgentina >= proximoEnvio)
            proximoEnvio = proximoEnvio.AddDays(1);

        return proximoEnvio - ahoraArgentina;
    }

    private async Task EnviarRecordatorioAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var webPushService = scope.ServiceProvider.GetRequiredService<IWebPushService>();

        await webPushService.EnviarATodosAsync(
            "¿Cargaste los gastos de hoy?",
            "Hacé click aquí para cargar lo que gastaste hoy",
            "/gastos",
            cancellationToken);

        _logger.LogInformation("Recordatorio de gastos enviado");
    }
}
