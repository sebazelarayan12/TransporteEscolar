using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

/// <summary>Mapeos de las entidades del módulo de recorridos a sus DTOs.</summary>
public static class RecorridoMappingExtensions
{
    /// <summary>Convierte una ubicación de dominio en su respuesta de API.</summary>
    public static UbicacionModel.Response ToResponse(this TitularUbicacion ubicacion)
    {
        ArgumentNullException.ThrowIfNull(ubicacion);

        return new UbicacionModel.Response(
            ubicacion.TitularId,
            ubicacion.Latitud,
            ubicacion.Longitud,
            ubicacion.DireccionNormalizada,
            ubicacion.Fuente.ToString(),
            ubicacion.FechaActualizacion);
    }

    /// <summary>Convierte un colegio de dominio en su respuesta de API.</summary>
    public static ColegioModel.Response ToResponse(this Colegio colegio)
    {
        ArgumentNullException.ThrowIfNull(colegio);

        return new ColegioModel.Response(
            colegio.Id,
            colegio.Nombre,
            colegio.Direccion,
            colegio.Latitud,
            colegio.Longitud);
    }
}
