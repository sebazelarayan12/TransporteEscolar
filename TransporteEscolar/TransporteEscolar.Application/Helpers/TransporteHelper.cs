using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Helpers;

public static class TransporteHelper
{
    public static byte Normalizar(byte? transporte)
    {
        if (!transporte.HasValue)
            return 1;

        var valor = transporte.Value;
        if (valor is 1 or 2)
            return valor;

        throw new ValidationException("El transporte seleccionado es inválido. Solo se admite 1 o 2");
    }
}
