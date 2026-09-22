using System.Globalization;

namespace TransporteEscolar.Domain.ValueObjects;

/// <summary>
/// Par latitud/longitud validado. Es un value object: dos coordenadas con los mismos
/// valores son iguales.
/// </summary>
/// <remarks>
/// Este proyecto usa siempre el orden (latitud, longitud). OSRM espera el orden inverso,
/// por eso existe <see cref="ToOsrm"/> como único punto de conversión.
/// </remarks>
public sealed record Coordenada
{
    /// <summary>Latitud en grados decimales. Rango válido: -90 a 90.</summary>
    public double Latitud { get; }

    /// <summary>Longitud en grados decimales. Rango válido: -180 a 180.</summary>
    public double Longitud { get; }

    /// <summary>Crea una coordenada validando que ambos valores sean finitos y estén en rango.</summary>
    /// <param name="latitud">Latitud en grados decimales.</param>
    /// <param name="longitud">Longitud en grados decimales.</param>
    /// <exception cref="ArgumentOutOfRangeException">Si algún valor es NaN, infinito o está fuera de rango.</exception>
    public Coordenada(double latitud, double longitud)
    {
        if (!double.IsFinite(latitud) || latitud < -90 || latitud > 90)
            throw new ArgumentOutOfRangeException(nameof(latitud), latitud, "La latitud debe ser un número entre -90 y 90");

        if (!double.IsFinite(longitud) || longitud < -180 || longitud > 180)
            throw new ArgumentOutOfRangeException(nameof(longitud), longitud, "La longitud debe ser un número entre -180 y 180");

        Latitud = latitud;
        Longitud = longitud;
    }

    /// <summary>
    /// Serializa la coordenada en el formato que espera OSRM: <c>longitud,latitud</c>.
    /// Usa <see cref="CultureInfo.InvariantCulture"/> para que el separador decimal
    /// sea siempre un punto, sin importar la cultura del servidor.
    /// </summary>
    /// <returns>Cadena con formato <c>"-65.2742406,-26.8158608"</c>.</returns>
    public string ToOsrm()
    {
        var longitud = Longitud.ToString("R", CultureInfo.InvariantCulture);
        var latitud = Latitud.ToString("R", CultureInfo.InvariantCulture);
        return $"{longitud},{latitud}";
    }
}
