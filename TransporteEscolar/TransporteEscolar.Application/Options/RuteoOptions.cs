using System.ComponentModel.DataAnnotations;

namespace TransporteEscolar.Application.Options;

/// <summary>Configuración del motor de ruteo. Se enlaza con la sección <c>Ruteo</c>.</summary>
public class RuteoOptions
{
    public const string SectionName = "Ruteo";

    /// <summary>
    /// URL base del servicio OSRM, sin barra final.
    /// Se carga por la variable de entorno <c>Ruteo__BaseUrl</c>.
    /// </summary>
    [Required(AllowEmptyStrings = false)]
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>Timeout de cada consulta, en segundos.</summary>
    [Range(1, 120)]
    public int TimeoutSegundos { get; set; } = 20;

    /// <summary>Perfil de OSRM. Para transporte escolar siempre es <c>driving</c>.</summary>
    public string PerfilVehiculo { get; set; } = "driving";

    /// <summary>
    /// Pausa entre consultas consecutivas al motor, en milisegundos.
    /// El demo público de OSRM limita a 1 request por segundo; con instancia propia se puede poner 0.
    /// </summary>
    [Range(0, 10000)]
    public int PausaEntreConsultasMs { get; set; } = 1100;
}
