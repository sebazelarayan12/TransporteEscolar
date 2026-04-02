namespace TransporteEscolar.Application.Options;

public sealed class MercadoPagoSettings
{
    public const string SectionName = "MercadoPago";

    public string? AccessTokenSandbox { get; set; }
    public string? AccessTokenProd { get; set; }
    public string? WebhookBaseUrl { get; set; }
    public bool UseSandbox { get; set; } = true;
}
