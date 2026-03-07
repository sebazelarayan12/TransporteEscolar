namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Abstracción del proveedor de WhatsApp Business API.
/// Permite intercambiar Meta Cloud API por Twilio u otro sin cambiar el resto del sistema.
/// </summary>
public interface IWhatsAppProvider
{
    /// <summary>
    /// Envía un mensaje de plantilla aprobada por WhatsApp.
    /// </summary>
    /// <param name="telefono">Número destino en formato E.164, solo dígitos (ej: 5491112345678).</param>
    /// <param name="templateName">Nombre exacto de la plantilla tal como está en Meta Business Manager.</param>
    /// <param name="parameters">Variables del body de la plantilla, en orden: {{1}}, {{2}}, etc.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    Task<WhatsAppSendResult> EnviarTemplateMensajeAsync(
        string telefono,
        string templateName,
        string[] parameters,
        CancellationToken cancellationToken = default);
}

/// <summary>Resultado del intento de envío.</summary>
public record WhatsAppSendResult(bool Exitoso, string? MessageId, string? ErrorDetalle);
