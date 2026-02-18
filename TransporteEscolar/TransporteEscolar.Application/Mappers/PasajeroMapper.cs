using System.Collections.Generic;
using System.Linq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class PasajeroMapper
{
    public static PasajeroModel.Response MapearAResponse(Pasajero pasajero)
    {
        var apellido = pasajero.Titular?.Apellido ?? string.Empty;

        var horariosAsignados = pasajero.PasajeroHorarios?
            .OrderBy(ph => ph.Prioridad)
            .ThenBy(ph => ph.FechaAsignacion)
            .Select(ph => new PasajeroHorarioModel.Response(
                ph.HorarioId,
                ph.Horario?.Etiqueta ?? string.Empty,
                ph.EsPrincipal,
                ph.Prioridad,
                ph.FechaAsignacion,
                ph.Transporte))
            .ToList() ?? new List<PasajeroHorarioModel.Response>();

        var horarioPrincipal = horariosAsignados.FirstOrDefault(h => h.EsPrincipal) ?? horariosAsignados.FirstOrDefault();

        HorarioModel.Resumen? horario = null;
        string? horarioDescripcion = null;
        int? horarioId = null;

        if (horarioPrincipal != null && !string.IsNullOrWhiteSpace(horarioPrincipal.HorarioEtiqueta))
        {
            horarioDescripcion = horarioPrincipal.HorarioEtiqueta;
            horarioId = horarioPrincipal.HorarioId;
            horario = new HorarioModel.Resumen(horarioPrincipal.HorarioId, horarioPrincipal.HorarioEtiqueta);
        }

        return new PasajeroModel.Response(
            pasajero.Id,
            pasajero.TitularId,
            pasajero.Nombre,
            apellido,
            $"{pasajero.Nombre} {apellido}".Trim(),
            pasajero.Colegio,
            pasajero.GradoCurso,
            pasajero.Turno,
            pasajero.Observaciones,
            horarioId,
            horarioDescripcion,
            pasajero.FechaAlta,
            pasajero.FechaBaja,
            pasajero.FechaBaja == null,
            apellido,
            horario,
            horariosAsignados);
    }
}
