using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class PasajeroMapper
{
    public static PasajeroModel.Response MapearAResponse(Pasajero pasajero)
    {
        var apellido = pasajero.Titular?.Apellido ?? string.Empty;

        HorarioModel.Resumen? horario = null;
        string? horarioDescripcion = null;
        if (pasajero.HorarioId.HasValue)
        {
            var etiqueta = pasajero.Horario?.Etiqueta;
            if (!string.IsNullOrWhiteSpace(etiqueta))
            {
                horarioDescripcion = etiqueta;
                horario = new HorarioModel.Resumen(pasajero.HorarioId.Value, etiqueta);
            }
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
            pasajero.HorarioId,
            horarioDescripcion,
            pasajero.FechaAlta,
            pasajero.FechaBaja,
            pasajero.FechaBaja == null,
            apellido,
            horario);
    }
}
