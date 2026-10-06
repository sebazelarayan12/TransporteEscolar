using System.Text.RegularExpressions;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Application.Validation;

/// <summary>Reglas de entrada para crear y editar horarios.</summary>
public static class HorarioValidator
{
    public const int EtiquetaMaxLength = 100;

    // Hora (8, 08, 8:15, 13:30) + espacio + descripción. HorariosGrid, en el front, parte la etiqueta con la
    // misma forma para mostrar la hora y el recorrido, así que este formato es parte del diseño.
    private static readonly Regex EtiquetaRegex =
        new(@"^(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s+\S.*$", RegexOptions.Compiled);

    /// <summary>Valida la etiqueta y la devuelve sin espacios sobrantes.</summary>
    public static string ValidarEtiqueta(string? etiqueta)
    {
        if (string.IsNullOrWhiteSpace(etiqueta))
            throw new ValidationException("La etiqueta es obligatoria");

        var limpia = etiqueta.Trim();

        if (limpia.Length > EtiquetaMaxLength)
            throw new ValidationException($"La etiqueta no puede superar los {EtiquetaMaxLength} caracteres");

        if (!EtiquetaRegex.IsMatch(limpia))
            throw new ValidationException(
                "La etiqueta debe empezar con la hora y seguir con el nombre, por ejemplo \"8 San Patricio\" o \"13:30 Boisdron Salida\"");

        return limpia;
    }

    public static void ValidarOrden(int orden)
    {
        if (orden < 1)
            throw new ValidationException("El orden debe ser mayor o igual a 1");
    }

    public static void ValidarSentido(SentidoHorario sentido)
    {
        if (!Enum.IsDefined(sentido))
            throw new ValidationException("El sentido debe ser Ida o Vuelta");
    }

    public static void ValidarColegioId(int colegioId)
    {
        if (colegioId <= 0)
            throw new ValidationException("Debes elegir un colegio");
    }
}
