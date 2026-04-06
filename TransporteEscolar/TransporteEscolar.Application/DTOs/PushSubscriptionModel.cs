namespace TransporteEscolar.Application.DTOs;

public static class PushSubscriptionModel
{
    public record SubscribeRequest(
        string Endpoint,
        string P256dh,
        string Auth,
        string? UserAgent = null
    );

    public record UnsubscribeRequest(
        string Endpoint
    );

    public record VapidPublicKeyResponse(
        string PublicKey
    );
}
