using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Ubicación geográfica de la casa de un titular. Relación uno a uno con <see cref="Titular"/>.
/// Vive en su propia tabla para no modificar <c>Titulares</c>.
/// </summary>
public class TitularUbicacion
{
    public int Id { get; private set; }

    public int TitularId { get; private set; }

    public double Latitud { get; private set; }

    public double Longitud { get; private set; }

    /// <summary>
    /// Dirección tal como la devolvió el buscador, si se usó. Es informativa:
    /// la ubicación real la dan las coordenadas.
    /// </summary>
    public string? DireccionNormalizada { get; private set; }

    public FuenteUbicacion Fuente { get; private set; }

    /// <summary>Momento de la última modificación del pin, en UTC.</summary>
    public DateTime FechaActualizacion { get; private set; }

    /// <summary>Navegación hacia el titular dueño de esta ubicación.</summary>
    public Titular Titular { get; private set; } = null!;

    /// <summary>Constructor para EF Core. No usar desde el código de aplicación.</summary>
    private TitularUbicacion()
    {
    }

    /// <summary>Crea la ubicación de un titular.</summary>
    /// <param name="titularId">Id del titular. Debe ser mayor a cero.</param>
    /// <param name="latitud">Latitud en grados decimales.</param>
    /// <param name="longitud">Longitud en grados decimales.</param>
    /// <param name="direccionNormalizada">Dirección legible opcional.</param>
    /// <param name="fuente">Origen de la ubicación.</param>
    /// <exception cref="ArgumentOutOfRangeException">Si el id no es válido o las coordenadas están fuera de rango.</exception>
    public TitularUbicacion(
        int titularId,
        double latitud,
        double longitud,
        string? direccionNormalizada,
        FuenteUbicacion fuente)
    {
        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        _ = new Coordenada(latitud, longitud);

        TitularId = titularId;
        Latitud = latitud;
        Longitud = longitud;
        DireccionNormalizada = NormalizarTexto(direccionNormalizada);
        Fuente = fuente;
        FechaActualizacion = DateTime.UtcNow;
    }

    /// <summary>Devuelve el pin como value object.</summary>
    public Coordenada ObtenerCoordenada() => new(Latitud, Longitud);

    /// <summary>Mueve el pin y registra la fecha del cambio.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Si las coordenadas están fuera de rango. El estado no se modifica.</exception>
    public void Mover(double latitud, double longitud, string? direccionNormalizada, FuenteUbicacion fuente)
    {
        _ = new Coordenada(latitud, longitud);

        Latitud = latitud;
        Longitud = longitud;
        DireccionNormalizada = NormalizarTexto(direccionNormalizada);
        Fuente = fuente;
        FechaActualizacion = DateTime.UtcNow;
    }

    private static string? NormalizarTexto(string? valor)
    {
        return string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
    }
}
