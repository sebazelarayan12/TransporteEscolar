namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Ruta por calles entre la casa de un titular y un colegio. Es el resultado cacheado
/// del motor de ruteo: se calcula una vez y se reutiliza hasta que cambia algún pin.
/// </summary>
/// <remarks>
/// La unidad es el par (Titular, Colegio), no el pasajero. Dos hermanos en el mismo
/// colegio comparten este recorrido porque la combi hace un solo viaje.
/// </remarks>
public class Recorrido
{
    public int Id { get; private set; }

    public int TitularId { get; private set; }

    public int ColegioId { get; private set; }

    /// <summary>Distancia de un viaje, en metros.</summary>
    public int DistanciaMetros { get; private set; }

    /// <summary>Duración estimada sin tráfico, en segundos.</summary>
    public int DuracionSegundos { get; private set; }

    /// <summary>Geometría codificada para dibujar la ruta en el mapa. Puede ser null.</summary>
    public string? GeometriaPolyline { get; private set; }

    /// <summary>Motor que calculó la ruta. Sirve para rastrear resultados viejos si se cambia de proveedor.</summary>
    public string Proveedor { get; private set; } = null!;

    /// <summary>
    /// Huella del par origen/destino usado en el cálculo. Si no coincide con el hash actual
    /// de los pines, este recorrido quedó obsoleto.
    /// </summary>
    public string HashOrigenDestino { get; private set; } = null!;

    public DateTime FechaCalculo { get; private set; }

    public Colegio Colegio { get; private set; } = null!;

    /// <summary>Constructor para EF Core. No usar desde el código de aplicación.</summary>
    private Recorrido()
    {
    }

    /// <summary>Crea un recorrido calculado.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Si algún id o medida es inválido.</exception>
    /// <exception cref="ArgumentException">Si falta el proveedor o el hash.</exception>
    public Recorrido(
        int titularId,
        int colegioId,
        int distanciaMetros,
        int duracionSegundos,
        string? geometriaPolyline,
        string proveedor,
        string hashOrigenDestino)
    {
        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        if (colegioId <= 0)
            throw new ArgumentOutOfRangeException(nameof(colegioId), colegioId, "El id del colegio debe ser mayor a cero");

        if (string.IsNullOrWhiteSpace(proveedor))
            throw new ArgumentException("El proveedor es obligatorio", nameof(proveedor));

        ValidarMedidas(distanciaMetros, duracionSegundos);
        ValidarHash(hashOrigenDestino);

        TitularId = titularId;
        ColegioId = colegioId;
        DistanciaMetros = distanciaMetros;
        DuracionSegundos = duracionSegundos;
        GeometriaPolyline = geometriaPolyline;
        Proveedor = proveedor.Trim();
        HashOrigenDestino = hashOrigenDestino.Trim();
        FechaCalculo = DateTime.UtcNow;
    }

    /// <summary>
    /// Indica si el recorrido sigue siendo válido para los pines actuales.
    /// </summary>
    /// <param name="hashActual">Hash calculado con las coordenadas vigentes.</param>
    public bool EstaVigente(string hashActual)
    {
        return !string.IsNullOrWhiteSpace(hashActual)
            && string.Equals(HashOrigenDestino, hashActual.Trim(), StringComparison.Ordinal);
    }

    /// <summary>Reemplaza el resultado del cálculo.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Si alguna medida es negativa. El estado no se modifica.</exception>
    /// <exception cref="ArgumentException">Si falta el hash. El estado no se modifica.</exception>
    public void Actualizar(
        int distanciaMetros,
        int duracionSegundos,
        string? geometriaPolyline,
        string hashOrigenDestino)
    {
        ValidarMedidas(distanciaMetros, duracionSegundos);
        ValidarHash(hashOrigenDestino);

        DistanciaMetros = distanciaMetros;
        DuracionSegundos = duracionSegundos;
        GeometriaPolyline = geometriaPolyline;
        HashOrigenDestino = hashOrigenDestino.Trim();
        FechaCalculo = DateTime.UtcNow;
    }

    private static void ValidarMedidas(int distanciaMetros, int duracionSegundos)
    {
        if (distanciaMetros < 0)
            throw new ArgumentOutOfRangeException(nameof(distanciaMetros), distanciaMetros, "La distancia no puede ser negativa");

        if (duracionSegundos < 0)
            throw new ArgumentOutOfRangeException(nameof(duracionSegundos), duracionSegundos, "La duración no puede ser negativa");
    }

    private static void ValidarHash(string hashOrigenDestino)
    {
        if (string.IsNullOrWhiteSpace(hashOrigenDestino))
            throw new ArgumentException("El hash de origen/destino es obligatorio", nameof(hashOrigenDestino));
    }
}
