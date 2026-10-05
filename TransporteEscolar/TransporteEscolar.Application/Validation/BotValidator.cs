using TransporteEscolar.Application.Exceptions;

namespace TransporteEscolar.Application.Validation;

public static class BotValidator
{
    /// <summary>
    /// Valida el número recibido por el bot. Solo rechaza lo que no puede ser un teléfono en absoluto
    /// (falta o no tiene ningún dígito); si tiene dígitos pero no es normalizable, es un resultado vacío, no un error.
    /// </summary>
    public static void ValidarNumero(string? numero)
    {
        if (string.IsNullOrWhiteSpace(numero) || !numero.Any(char.IsAsciiDigit))
            throw new ValidationException("El número de teléfono es requerido y debe contener dígitos");
    }
}
