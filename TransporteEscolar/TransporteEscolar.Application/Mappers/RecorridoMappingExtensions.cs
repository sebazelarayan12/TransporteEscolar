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

    /// <summary>Convierte una parada fija de dominio en su respuesta de API.</summary>
    /// <param name="horarioEtiqueta">Etiqueta del horario, resuelta aparte porque la entidad no la conoce.</param>
    /// <param name="titularApellido">Apellido del titular, resuelto aparte por la misma razón.</param>
    public static ParadaFijaModel.Response ToResponse(this ParadaFija paradaFija, string horarioEtiqueta, string titularApellido)
    {
        ArgumentNullException.ThrowIfNull(paradaFija);

        return new ParadaFijaModel.Response(
            paradaFija.HorarioId,
            horarioEtiqueta,
            paradaFija.Transporte,
            paradaFija.TitularId,
            titularApellido,
            paradaFija.FechaAsignacion);
    }
}
