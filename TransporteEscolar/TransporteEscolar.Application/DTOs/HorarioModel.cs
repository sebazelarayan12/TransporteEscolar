namespace TransporteEscolar.Application.DTOs;

public record HorarioModel
{
    public record Response(
        int Id,
        string Etiqueta,
        int Orden,
        int PasajerosActivos);

    public record Resumen(
        int Id,
        string Etiqueta);

    public record PasajerosAsignados(
        int HorarioId,
        string HorarioEtiqueta,
        List<PasajeroHorarioModel.PasajeroAsignado> Pasajeros);

    public record PasajerosResponse(
        Resumen Horario,
        List<PasajeroModel.Response> Pasajeros,
        PasajerosAsignados PasajerosAsignados);

    public record AsignacionDetalle(
        int PasajeroId,
        bool EsPrincipal,
        int? Prioridad = null);

    public record AsignacionRequest(
        List<int>? PasajeroIds = null,
        List<AsignacionDetalle>? Pasajeros = null);
}
