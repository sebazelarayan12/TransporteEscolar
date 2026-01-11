using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class ReinscripcionValidator
{
    public static void Validate(ReinscripcionModel.Request request)
    {
        if (request.Anio < 2020 || request.Anio > 2100)
            throw new ValidationException("Año inválido");
    }
}
