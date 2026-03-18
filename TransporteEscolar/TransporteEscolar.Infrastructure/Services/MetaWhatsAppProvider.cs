using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Infrastructure.Services;

/// <summary>
/// Proveedor de WhatsApp usando Meta Cloud API directamente.
/// Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/template-messages
/// </summary>
public class MetaWhatsAppProvider : IWhatsAppProvider
{
    private readonly HttpClient _httpClient;
    private readonly MetaWhatsAppOptions _options;
    private readonly ILogger<MetaWhatsAppProvider> _logger;

    public MetaWhatsAppProvider(
        HttpClient httpClient,
        IOptions<MetaWhatsAppOptions> options,
        ILogger<MetaWhatsAppProvider> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<WhatsAppSendResult> EnviarTemplateMensajeAsync(
        string telefono,
        string templateName,
        string[] parameters,
        CancellationToken cancellationToken = default)
    {
        // Construye el payload que Meta espera
        var payload = new MetaMessageRequest
        {
            MessagingProduct = "whatsapp",
            To = telefono,
            Type = "template",
            Template = new MetaTemplate
            {
                Name = templateName,
                Language = new MetaLanguage { Code = _options.LanguageCode },
                Components = parameters.Length > 0
                    ? new[]
                    {
                        new MetaTemplateComponent
                        {
                            Type = "body",
                            Parameters = parameters
                                .Select(p => new MetaTemplateParameter { Type = "text", Text = p })
                                .ToArray()
                        }
                    }
                    : Array.Empty<MetaTemplateComponent>()
            }
        };

        var url = $"https://graph.facebook.com/{_options.ApiVersion}/{_options.PhoneNumberId}/messages";

        _logger.LogDebug("Enviando WhatsApp a {Telefono} con template {Template}", telefono, templateName);

        try
        {
            var response = await _httpClient.PostAsJsonAsync(url, payload, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                // Extrae el wamid ('messages[0].id') de la respuesta de Meta
                var result = JsonSerializer.Deserialize<MetaSuccessResponse>(body);
                var messageId = result?.Messages?.FirstOrDefault()?.Id ?? "unknown";

                _logger.LogInformation("WhatsApp enviado a {Telefono}. MessageId: {MessageId}", telefono, messageId);
                return new WhatsAppSendResult(Exitoso: true, MessageId: messageId, ErrorDetalle: null);
            }
            else
            {
                _logger.LogWarning("Error al enviar WhatsApp a {Telefono}. Status: {Status}. Body: {Body}",
                    telefono, response.StatusCode, body);
                return new WhatsAppSendResult(Exitoso: false, MessageId: null, ErrorDetalle: $"HTTP {(int)response.StatusCode}: {body}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al enviar WhatsApp a {Telefono}", telefono);
            return new WhatsAppSendResult(Exitoso: false, MessageId: null, ErrorDetalle: ex.Message);
        }
    }
}

// ── DTOs para serialización ────────────────────────────────────────────────

internal class MetaMessageRequest
{
    [JsonPropertyName("messaging_product")] public string MessagingProduct { get; set; } = null!;
    [JsonPropertyName("to")]                public string To               { get; set; } = null!;
    [JsonPropertyName("type")]              public string Type             { get; set; } = null!;
    [JsonPropertyName("template")]          public MetaTemplate Template   { get; set; } = null!;
}

internal class MetaTemplate
{
    [JsonPropertyName("name")]       public string Name                   { get; set; } = null!;
    [JsonPropertyName("language")]   public MetaLanguage Language         { get; set; } = null!;
    [JsonPropertyName("components")] public MetaTemplateComponent[] Components { get; set; } = Array.Empty<MetaTemplateComponent>();
}

internal class MetaLanguage
{
    [JsonPropertyName("code")] public string Code { get; set; } = null!;
}

internal class MetaTemplateComponent
{
    [JsonPropertyName("type")]       public string Type                      { get; set; } = null!;
    [JsonPropertyName("parameters")] public MetaTemplateParameter[] Parameters { get; set; } = Array.Empty<MetaTemplateParameter>();
}

internal class MetaTemplateParameter
{
    [JsonPropertyName("type")] public string Type { get; set; } = null!;
    [JsonPropertyName("text")] public string Text { get; set; } = null!;
}

internal class MetaSuccessResponse
{
    [JsonPropertyName("messages")] public MetaMessageInfo[]? Messages { get; set; }
}

internal class MetaMessageInfo
{
    [JsonPropertyName("id")] public string? Id { get; set; }
}
