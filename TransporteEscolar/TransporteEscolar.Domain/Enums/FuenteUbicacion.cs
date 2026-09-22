namespace TransporteEscolar.Domain.Enums;

/// <summary>De dónde salió la ubicación de un titular.</summary>
public enum FuenteUbicacion
{
    /// <summary>El usuario colocó el pin a mano en el mapa. Es la fuente confiable.</summary>
    Manual = 1,

    /// <summary>
    /// La ubicación vino del geocoder y nadie la confirmó. En Yerba Buena la cobertura
    /// de numeración es parcial, así que estos pines pueden estar a cuadras de la casa real.
    /// </summary>
    Geocoder = 2
}
