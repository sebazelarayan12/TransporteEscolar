namespace TransporteEscolar.Infrastructure.Services;

/// <summary>
/// Opciones de configuración para la Meta Cloud API de WhatsApp.
/// Leerlas desde appsettings (inyectadas vía IOptions).
/// </summary>
public class MetaWhatsAppOptions
{
    public const string SectionName = "MetaWhatsApp";

    /// <summary>Token de acceso del System User de Meta Business. Guardar en Secret/EnvironmentVariable, nunca en appsettings.json commiteado.</summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>ID del número de teléfono configurado en Meta Business (Phone Number ID).</summary>
    public string PhoneNumberId { get; set; } = string.Empty;

    /// <summary>Versión de la API de Graph. Por defecto la estable actual.</summary>
    public string ApiVersion { get; set; } = string.Empty;

    /// <summary>Código de idioma de las plantillas. Ej: es_AR, es, en_US.</summary>
    public string LanguageCode { get; set; } = string.Empty;

    /// <summary>Nombre de la plantilla aprobada en Meta Business Manager.</summary>
    public string TemplateName { get; set; } = string.Empty;
}
