namespace TransporteEscolar.Application.Diciembre.DTOs;

public static class DiciembreModel
{
    /// <summary>Cuerpo del PUT. <c>Va</c> es obligatorio: un campo ausente no debe leerse como "no va".</summary>
    public sealed record Request(int Anio, bool? Va, decimal? Monto);

    public sealed record TitularItem(
        int TitularId,
        string Apellido,
        string NombreContacto,
        List<string> Pasajeros,
        string Estado,
        decimal MontoPactado,
        decimal? MontoDiciembre,
        int? PagoMensualId,
        decimal TotalPagado,
        bool CuotaPreexistente);

    public sealed record Response(int Anio, List<TitularItem> Titulares);
}

/// <summary>Valores del campo <c>estado</c> del contrato de la API (cadenas, no enum).</summary>
public static class DiciembreEstados
{
    public const string Pendiente = "Pendiente";
    public const string Va = "Va";
    public const string NoVa = "NoVa";
}
