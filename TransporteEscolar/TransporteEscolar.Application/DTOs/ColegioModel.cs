namespace TransporteEscolar.Application.DTOs;

/// <summary>DTOs de colegios.</summary>
public static class ColegioModel
{
    /// <summary>Colegio con su ubicación, para dibujarlo en el mapa.</summary>
    public sealed record Response(
        int Id,
        string Nombre,
        string Direccion,
        double Latitud,
        double Longitud);
}
