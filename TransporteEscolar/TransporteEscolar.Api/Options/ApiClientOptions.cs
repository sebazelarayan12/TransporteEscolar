namespace TransporteEscolar.Api.Options;

/// <summary>
/// Un cliente máquina-a-máquina de la API (por ejemplo un bot). Se configura en
/// <c>ApiClients__&lt;Nombre&gt;__Key</c> y <c>ApiClients__&lt;Nombre&gt;__Scopes__0</c>;
/// nunca se hardcodea ni se commitea un valor real.
/// </summary>
public class ApiClientOptions
{
    /// <summary>Sección de configuración que contiene un diccionario nombre → cliente.</summary>
    public const string SectionName = "ApiClients";

    /// <summary>Clave esperada en el header <c>X-Api-Key</c>. Vacía o en blanco = el cliente se ignora.</summary>
    public string? Key { get; set; }

    /// <summary>Alcances que autoriza esta clave (por ejemplo <c>bot:identidad</c>).</summary>
    public List<string> Scopes { get; set; } = new();
}
