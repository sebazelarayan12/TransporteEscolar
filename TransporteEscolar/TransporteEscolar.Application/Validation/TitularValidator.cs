using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class TitularValidator
{
    public static void Validate(TitularModel.Request request)
    {
        if (string.IsNullOrWhiteSpace(request.Apellido))
            throw new ValidationException("El apellido es requerido");

        if (string.IsNullOrWhiteSpace(request.NombreContacto))
            throw new ValidationException("El nombre de contacto es requerido");

        if (string.IsNullOrWhiteSpace(request.Direccion))
            throw new ValidationException("La dirección es requerida");

        if (request.MontoMensualPactado <= 0)
            throw new ValidationException("El monto pactado debe ser mayor a 0");
    }

    public static void ValidateUpdate(TitularModel.UpdateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NombreContacto))
            throw new ValidationException("El nombre de contacto es requerido");

        if (string.IsNullOrWhiteSpace(request.Direccion))
            throw new ValidationException("La dirección es requerida");

        if (request.MontoMensualPactado <= 0)
            throw new ValidationException("El monto pactado debe ser mayor a 0");
    }
}
