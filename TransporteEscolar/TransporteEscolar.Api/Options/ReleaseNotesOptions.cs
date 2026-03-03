using System;

namespace TransporteEscolar.Api.Options;

public class ReleaseNotesOptions
{
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public DateTime? FechaPublicacionUtc { get; set; }
    public string? Link { get; set; }
}
