namespace TransporteEscolar.Application.Options;

public sealed class MercadoPagoSettings
{
    public const string SectionName = "MercadoPago";

    public string? AccessTokenSandbox { get; set; }
    public string? AccessTokenProd { get; set; }
    public string? WebhookBaseUrl { get; set; }
    public string? ReturnUrlSuccess { get; set; }
    public string? ReturnUrlPending { get; set; }
    public string? ReturnUrlFailure { get; set; }
    public bool UseSandbox { get; set; } = true;
}
