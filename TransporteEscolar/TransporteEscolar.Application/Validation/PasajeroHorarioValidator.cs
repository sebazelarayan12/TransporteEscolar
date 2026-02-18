using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;

namespace TransporteEscolar.Application.Validation;

public static class PasajeroHorarioValidator
{
    public static void Validate(PasajeroHorarioModel.AsignacionRequest request)
    {
        if (request is null)
            throw new ValidationException("La asignación de horario es obligatoria");

        if (request.HorarioId <= 0)
            throw new ValidationException("HorarioId inválido");

        if (request.Prioridad.HasValue && request.Prioridad.Value <= 0)
            throw new ValidationException("La prioridad debe ser mayor a cero");

        TransporteHelper.Normalizar(request.Transporte);
    }
}
