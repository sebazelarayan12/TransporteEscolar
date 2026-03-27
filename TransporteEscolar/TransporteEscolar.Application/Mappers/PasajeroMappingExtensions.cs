using System.Collections.Generic;
using System.Linq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class PasajeroMappingExtensions
{
    public static PasajeroModel.Response ToResponse(this Pasajero pasajero)
    {
        var apellido = pasajero.Titular?.Apellido ?? string.Empty;
        var horariosAsignados = pasajero.ToHorariosResponse();
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

    public static PasajeroModel.SinHorarioResponse ToSinHorarioResponse(this Pasajero pasajero)
    {
        var apellidoTitular = pasajero.Titular?.Apellido ?? string.Empty;
        var nombreTitular = pasajero.Titular != null
            ? $"{pasajero.Titular.NombreContacto} {pasajero.Titular.Apellido}".Trim()
            : string.Empty;

        return new PasajeroModel.SinHorarioResponse(
            pasajero.Id,
            pasajero.Nombre,
            apellidoTitular,
            nombreTitular,
            pasajero.Colegio,
            pasajero.Turno);
    }

    public static HorarioModel.Resumen? ToResumen(this Pasajero pasajero)
    {
        var principal = pasajero.PasajeroHorarios?
            .OrderByDescending(ph => ph.EsPrincipal)
            .ThenBy(ph => ph.Prioridad)
            .FirstOrDefault(ph => ph.Horario != null);

        if (principal == null)
        {
            return null;
        }

        var etiqueta = principal.Horario?.Etiqueta ?? string.Empty;
        if (string.IsNullOrWhiteSpace(etiqueta))
        {
            return null;
        }

        return new HorarioModel.Resumen(principal.HorarioId, etiqueta);
    }

    public static IReadOnlyList<PasajeroHorarioModel.Response> ToHorariosResponse(this Pasajero pasajero)
    {
        return pasajero.PasajeroHorarios?
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
    }
}
