using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Diciembre.Validation;

public static class DiciembreValidator
{
    private const decimal MontoMaximo = 10_000_000m;

    public static void ValidarAnio(int anio)
    {
        if (anio < 2000 || anio > 2100)
            throw new ValidationException("Año inválido");
    }

    public static void ValidarConfirmacion(int anio, bool? va, decimal? monto)
    {
        ValidarAnio(anio);

        if (va is null)
            throw new ValidationException("El campo va es obligatorio");

        if (va.Value)
        {
            if (monto is null || monto <= 0)
                throw new ValidationException("El monto de diciembre es obligatorio y debe ser mayor a 0");

            if (monto > MontoMaximo)
                throw new ValidationException("El monto de diciembre no puede superar $10.000.000");
        }
    }
}
