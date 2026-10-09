namespace TransporteEscolar.Application.Interfaces;

public interface IWebPushService
{
    Task EnviarATodosAsync(string titulo, string mensaje, string? url = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Envía el push tal cual viene, sin reemplazar el período del mensaje por el actual.
    /// </summary>
    Task EnviarATodosSinPeriodoAsync(string titulo, string mensaje, string? url = null, CancellationToken cancellationToken = default);

    string ObtenerClavePublicaVapid();
}
