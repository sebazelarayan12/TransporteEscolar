using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Api.Options;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Api.HostedServices;

public class ReleaseNotesInitializer : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReleaseNotesInitializer> _logger;

    public ReleaseNotesInitializer(
        IServiceProvider serviceProvider,
        ILogger<ReleaseNotesInitializer> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var notificacionService = scope.ServiceProvider.GetRequiredService<INotificacionService>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<ReleaseNotesOptions>>();

        var releaseNotes = options.Value;

        if (string.IsNullOrWhiteSpace(releaseNotes.Descripcion))
        {
            _logger.LogInformation("Release notes initializer disabled: description is empty.");
            return;
        }

        var titulo = string.IsNullOrWhiteSpace(releaseNotes.Titulo)
            ? "Actualización del sistema"
            : releaseNotes.Titulo.Trim();

        var descripcion = releaseNotes.Descripcion.Trim();
        var fechaPublicacion = releaseNotes.FechaPublicacionUtc ?? DateTime.UtcNow;
        var link = string.IsNullOrWhiteSpace(releaseNotes.Link) ? null : releaseNotes.Link.Trim();

        var request = new NotificacionModel.ActualizacionRequest(
            titulo,
            descripcion,
            fechaPublicacion,
            link);

        try
        {
            await notificacionService.GuardarActualizacionProductoAsync(request, cancellationToken);
            _logger.LogInformation("Release notes initializer published update dated {FechaPublicacion}.", fechaPublicacion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish release notes update.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
