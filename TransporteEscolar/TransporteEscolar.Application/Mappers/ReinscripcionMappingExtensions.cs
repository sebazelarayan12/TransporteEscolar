using System.Collections.Generic;
using System.Linq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class ReinscripcionMappingExtensions
{
    public static ReinscripcionModel.Response ToResponse(this ReinscripcionPasajero reinscripcion)
    {
        return new ReinscripcionModel.Response(
            reinscripcion.Id,
            reinscripcion.PasajeroId,
            reinscripcion.Anio,
            reinscripcion.Estado,
            reinscripcion.FechaCreacion,
            reinscripcion.FechaConfirmacion);
    }

    public static List<ReinscripcionModel.Response> ToResponses(this IEnumerable<ReinscripcionPasajero> reinscripciones)
    {
        return reinscripciones
            .OrderByDescending(r => r.Anio)
            .ThenByDescending(r => r.FechaCreacion)
            .Select(r => r.ToResponse())
            .ToList();
    }
}
