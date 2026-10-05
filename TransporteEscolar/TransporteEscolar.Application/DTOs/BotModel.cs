namespace TransporteEscolar.Application.DTOs;

/// <summary>
/// Contrato de solo lectura para el bot externo de inasistencias.
/// Expone el mínimo de datos: nunca dirección, montos, teléfonos, colegio, grado, turno ni observaciones.
/// </summary>
public static class BotModel
{
    /// <summary>Resultado de buscar familias por teléfono. Vacío si nadie coincide.</summary>
    /// <param name="Coincidencias">Titulares activos que tienen ese número (puede ser más de uno).</param>
    public sealed record Response(List<Coincidencia> Coincidencias);

    /// <summary>Familia que coincide con el número consultado.</summary>
    /// <param name="TitularId">Identificador del titular.</param>
    /// <param name="Apellido">Apellido del titular (guardado en mayúsculas).</param>
    /// <param name="NombreContacto">Nombre de la persona de contacto.</param>
    /// <param name="Pasajeros">Pasajeros activos de la familia.</param>
    public sealed record Coincidencia(int TitularId, string Apellido, string NombreContacto, List<PasajeroBasico> Pasajeros);

    /// <summary>Pasajero identificado solo por su nombre de pila.</summary>
    /// <param name="Id">Identificador del pasajero.</param>
    /// <param name="Nombre">Nombre de pila.</param>
    public sealed record PasajeroBasico(int Id, string Nombre);
}
