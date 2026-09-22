namespace TransporteEscolar.Application.DTOs;

/// <summary>DTOs del pin de ubicación de un titular.</summary>
public static class UbicacionModel
{
    /// <summary>Datos que envía el frontend al guardar un pin.</summary>
    /// <param name="Latitud">Latitud en grados decimales.</param>
    /// <param name="Longitud">Longitud en grados decimales.</param>
    /// <param name="DireccionNormalizada">Dirección legible opcional, la que devolvió el buscador.</param>
    /// <param name="EsManual">
    /// <c>true</c> si el usuario arrastró el pin. <c>false</c> si aceptó tal cual lo que propuso el buscador.
    /// </param>
    public sealed record Request(
        double Latitud,
        double Longitud,
        string? DireccionNormalizada,
        bool EsManual);

    /// <summary>Pin guardado.</summary>
    public sealed record Response(
        int TitularId,
        double Latitud,
        double Longitud,
        string? DireccionNormalizada,
        string Fuente,
        DateTime FechaActualizacion);
}
