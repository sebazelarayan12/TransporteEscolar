namespace TransporteEscolar.Application.DTOs;

public record PasajeroHorarioModel
{
    public record AsignacionRequest(
        int HorarioId,
        bool EsPrincipal,
        int? Prioridad = null,
        byte? Transporte = null);

    public record Response(
        int HorarioId,
        string HorarioEtiqueta,
        bool EsPrincipal,
        int Prioridad,
        DateTime FechaAsignacion,
        byte Transporte);

    public record PasajeroAsignado(
        int PasajeroId,
        string Nombre,
        string Apellido,
        string NombreCompleto,
        bool EsPrincipal,
        int Prioridad,
        DateTime FechaAsignacion,
        byte Transporte);
}
