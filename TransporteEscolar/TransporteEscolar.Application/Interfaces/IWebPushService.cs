namespace TransporteEscolar.Application.Interfaces;

public interface IWebPushService
{
    Task EnviarATodosAsync(string titulo, string mensaje, string? url = null, CancellationToken cancellationToken = default);

    string ObtenerClavePublicaVapid();
}
