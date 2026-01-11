using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class PasajeroValidator
{
    public static void Validate(PasajeroModel.Request request)
    {
        if (request.TitularId <= 0)
            throw new ValidationException("TitularId inválido");

        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new ValidationException("El nombre es requerido");

        if (string.IsNullOrWhiteSpace(request.Apellido))
            throw new ValidationException("El apellido es requerido");

        if (string.IsNullOrWhiteSpace(request.Colegio))
            throw new ValidationException("El colegio es requerido");

        if (string.IsNullOrWhiteSpace(request.GradoCurso))
            throw new ValidationException("El grado/curso es requerido");

        if (string.IsNullOrWhiteSpace(request.Turno))
            throw new ValidationException("El turno es requerido");
    }

    public static void ValidateUpdate(PasajeroModel.UpdateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Colegio))
            throw new ValidationException("El colegio es requerido");

        if (string.IsNullOrWhiteSpace(request.GradoCurso))
            throw new ValidationException("El grado/curso es requerido");

        if (string.IsNullOrWhiteSpace(request.Turno))
            throw new ValidationException("El turno es requerido");
    }
}
