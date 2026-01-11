using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class TelefonoValidator
{
    public static void Validate(TelefonoModel.Request request)
    {
        if (string.IsNullOrWhiteSpace(request.NumeroE164))
            throw new ValidationException("El número de teléfono es requerido");
    }
}
