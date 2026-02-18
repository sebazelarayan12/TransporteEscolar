namespace TransporteEscolar.Application.DTOs;

public record HorarioModel
{
    public record Response(
        int Id,
        string Etiqueta,
        int Orden,
        int PasajerosActivos,
        ConteoPorTransporte ConteosPorTransporte);

    public record Resumen(
        int Id,
        string Etiqueta);

    public record PasajerosAsignados(
        int HorarioId,
        string HorarioEtiqueta,
        List<PasajeroHorarioModel.PasajeroAsignado> Pasajeros,
        ConteoPorTransporte ConteosPorTransporte);

    public record PasajerosResponse(
        Resumen Horario,
        List<PasajeroModel.Response> Pasajeros,
        PasajerosAsignados PasajerosAsignados);

    public record AsignacionDetalle(
        int PasajeroId,
        bool EsPrincipal,
        int? Prioridad = null,
        byte? Transporte = null);

    public record AsignacionRequest(
        List<int>? PasajeroIds = null,
        List<AsignacionDetalle>? Pasajeros = null,
        byte? Transporte = null);

}
