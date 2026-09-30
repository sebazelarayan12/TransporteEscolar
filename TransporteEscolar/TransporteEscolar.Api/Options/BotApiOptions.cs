namespace TransporteEscolar.Api.Options;

/// <summary>
/// Configuración del acceso del bot externo. La clave viene de la variable de entorno
/// <c>BotApi__ApiKey</c>; nunca se hardcodea ni se commitea un valor real.
/// </summary>
public class BotApiOptions
{
    public const string SectionName = "BotApi";

    /// <summary>Clave esperada en el header <c>X-Api-Key</c>. Vacía o ausente = endpoint cerrado (503).</summary>
    public string? ApiKey { get; set; }
}
