using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class PagoMensualValidator
{
    public static void Validate(PagoMensualModel.Request request)
    {
        if (request.TitularId <= 0)
            throw new ValidationException("TitularId inválido");

        if (request.Mes < 1 || request.Mes > 12)
            throw new ValidationException("El mes debe estar entre 1 y 12");

        if (request.Anio < 2020 || request.Anio > 2100)
            throw new ValidationException("Año inválido");

        if (request.MontoGenerado <= 0)
            throw new ValidationException("El monto generado debe ser mayor a 0");
    }

    public static void ValidateRegistrarPago(PagoMensualModel.RegistrarPagoRequest request)
    {
        if (request.Monto <= 0)
            throw new ValidationException("El monto debe ser mayor a 0");

        if (string.IsNullOrWhiteSpace(request.MedioPago))
            throw new ValidationException("El medio de pago es requerido");
    }

    public static void ValidateAjusteTitular(PagoMensualModel.AjusteTitularRequest request)
    {
        if (request.NuevoMonto <= 0)
            throw new ValidationException("El nuevo monto debe ser mayor a 0");

        if (request.Motivo is not null)
        {
            var motivo = request.Motivo.Trim();
            if (motivo.Length > 200)
                throw new ValidationException("El motivo no puede superar los 200 caracteres");
        }
    }
}
