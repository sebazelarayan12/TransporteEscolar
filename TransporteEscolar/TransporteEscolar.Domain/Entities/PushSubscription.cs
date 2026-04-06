namespace TransporteEscolar.Domain.Entities;

public class PushSubscription
{
    public int Id { get; private set; }
    public string Endpoint { get; private set; } = null!;
    public string P256dh { get; private set; } = null!;
    public string Auth { get; private set; } = null!;
    public DateTime FechaCreacion { get; private set; }
    public DateTime? UltimoUso { get; private set; }
    public string? UserAgent { get; private set; }

    private PushSubscription()
    {
    }

    public PushSubscription(string endpoint, string p256dh, string auth, string? userAgent = null)
    {
        Endpoint = endpoint;
        P256dh = p256dh;
        Auth = auth;
        UserAgent = userAgent;
        FechaCreacion = DateTime.UtcNow;
    }

    public void ActualizarUltimoUso()
    {
        UltimoUso = DateTime.UtcNow;
    }

    public void Actualizar(string p256dh, string auth, string? userAgent)
    {
        P256dh = p256dh;
        Auth = auth;
        UserAgent = userAgent;
        UltimoUso = DateTime.UtcNow;
    }
}
