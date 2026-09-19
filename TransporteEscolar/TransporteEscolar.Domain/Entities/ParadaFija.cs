namespace TransporteEscolar.Domain.Entities;

/// <summary>
/// Casa elegida a mano como extremo fijo del recorrido de un viaje (horario, vehículo):
/// la primera parada en los horarios de ida, la última en los de vuelta.
/// </summary>
public class ParadaFija
{
    public int Id { get; private set; }

    public int HorarioId { get; private set; }

    /// <summary>Vehículo: 1 (Ducato) o 2 (Sprinter).</summary>
    public byte Transporte { get; private set; }

    public int TitularId { get; private set; }

    /// <summary>Momento en que se asignó (o reasignó) esta parada fija, en UTC.</summary>
    public DateTime FechaAsignacion { get; private set; }

    /// <summary>Constructor para EF Core. No usar desde el código de aplicación.</summary>
    private ParadaFija()
    {
    }

    /// <summary>Crea la parada fija de un viaje.</summary>
    /// <param name="horarioId">Id del horario. Debe ser mayor a cero.</param>
    /// <param name="transporte">Vehículo: 1 o 2.</param>
    /// <param name="titularId">Id del titular elegido. Debe ser mayor a cero.</param>
    /// <exception cref="ArgumentOutOfRangeException">Si algún id o el transporte son inválidos.</exception>
    public ParadaFija(int horarioId, byte transporte, int titularId)
    {
        if (horarioId <= 0)
            throw new ArgumentOutOfRangeException(nameof(horarioId), horarioId, "El id del horario debe ser mayor a cero");

        if (transporte is not (1 or 2))
            throw new ArgumentOutOfRangeException(nameof(transporte), transporte, "El transporte debe ser 1 o 2");

        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        HorarioId = horarioId;
        Transporte = transporte;
        TitularId = titularId;
        FechaAsignacion = DateTime.UtcNow;
    }

    /// <summary>Cambia el titular elegido para esta parada fija y registra la fecha del cambio.</summary>
    /// <exception cref="ArgumentOutOfRangeException">Si el id del titular no es válido.</exception>
    public void ReasignarTitular(int titularId)
    {
        if (titularId <= 0)
            throw new ArgumentOutOfRangeException(nameof(titularId), titularId, "El id del titular debe ser mayor a cero");

        TitularId = titularId;
        FechaAsignacion = DateTime.UtcNow;
    }
}
