namespace TransporteEscolar.Domain.Enums;

/// <summary>Dirección del recorrido de un horario.</summary>
public enum SentidoHorario
{
    /// <summary>De las casas al colegio. Se fija la primera casa del recorrido.</summary>
    Ida = 1,

    /// <summary>Del colegio a las casas. Se fija la última casa del recorrido.</summary>
    Vuelta = 2
}
