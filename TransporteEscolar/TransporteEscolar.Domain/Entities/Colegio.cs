using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Colegio de destino de los recorridos. Se vincula con <c>Pasajero.Colegio</c> por nombre
/// y con <c>Horario.ColegioId</c> por clave foránea.
/// </summary>
public class Colegio
{
    public int Id { get; private set; }

    /// <summary>Nombre del colegio. Debe coincidir con el texto guardado en <c>Pasajero.Colegio</c>.</summary>
    public string Nombre { get; private set; } = null!;

    /// <summary>Dirección legible. Solo informativa: la ubicación real la dan las coordenadas.</summary>
    public string Direccion { get; private set; } = null!;

    public double Latitud { get; private set; }

    public double Longitud { get; private set; }

    /// <summary>Un colegio inactivo se excluye de los cálculos nuevos pero conserva su historia.</summary>
    public bool Activo { get; private set; }

    /// <summary>Constructor para EF Core. No usar desde el código de aplicación.</summary>
    private Colegio()
    {
    }

    /// <summary>Crea un colegio activo.</summary>
    /// <param name="nombre">Nombre del colegio. No puede ser vacío.</param>
    /// <param name="direccion">Dirección legible.</param>
    /// <param name="latitud">Latitud en grados decimales.</param>
    /// <param name="longitud">Longitud en grados decimales.</param>
    /// <exception cref="ArgumentException">Si el nombre está vacío.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Si las coordenadas están fuera de rango.</exception>
    public Colegio(string nombre, string direccion, double latitud, double longitud)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del colegio es obligatorio", nameof(nombre));

        // Valida rangos antes de asignar. Si falla, el objeto no llega a existir.
        _ = new Coordenada(latitud, longitud);

        Nombre = nombre.Trim();
        Direccion = direccion?.Trim() ?? string.Empty;
        Latitud = latitud;
        Longitud = longitud;
        Activo = true;
    }

    /// <summary>Devuelve la ubicación del colegio como value object.</summary>
    public Coordenada ObtenerCoordenada() => new(Latitud, Longitud);

    /// <summary>Mueve el pin del colegio.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Si las coordenadas están fuera de rango. El estado no se modifica.</exception>
    public void ActualizarUbicacion(double latitud, double longitud)
    {
        _ = new Coordenada(latitud, longitud);

        Latitud = latitud;
        Longitud = longitud;
    }

    /// <summary>Actualiza los datos descriptivos del colegio.</summary>
    /// <exception cref="ArgumentException">Si el nombre está vacío.</exception>
    public void ActualizarDatos(string nombre, string direccion)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre del colegio es obligatorio", nameof(nombre));

        Nombre = nombre.Trim();
        Direccion = direccion?.Trim() ?? string.Empty;
    }

    public void Desactivar() => Activo = false;

    public void Reactivar() => Activo = true;
}
