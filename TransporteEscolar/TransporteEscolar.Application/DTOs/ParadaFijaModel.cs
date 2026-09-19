namespace TransporteEscolar.Application.DTOs;

/// <summary>DTOs de la parada fija: la casa elegida a mano como extremo de cada viaje.</summary>
public static class ParadaFijaModel
{
    /// <summary>Parada fija marcada para un viaje.</summary>
    /// <param name="HorarioId">Id del horario del viaje.</param>
    /// <param name="HorarioEtiqueta">Etiqueta del horario, para mostrar.</param>
    /// <param name="Transporte">Vehículo: 1 (Ducato) o 2 (Sprinter).</param>
    /// <param name="TitularId">Titular elegido como extremo fijo del recorrido.</param>
    /// <param name="TitularApellido">Apellido del titular, para mostrar.</param>
    /// <param name="FechaAsignacion">Cuándo se asignó (o reasignó) esta parada fija.</param>
    public sealed record Response(
        int HorarioId,
        string HorarioEtiqueta,
        byte Transporte,
        int TitularId,
        string TitularApellido,
        DateTime FechaAsignacion);

    /// <summary>Pedido para marcar la parada fija de un viaje.</summary>
    /// <param name="TitularId">Titular elegido. Debe viajar en ese horario y vehículo, y tener ubicación cargada.</param>
    public sealed record Request(int TitularId);
}
