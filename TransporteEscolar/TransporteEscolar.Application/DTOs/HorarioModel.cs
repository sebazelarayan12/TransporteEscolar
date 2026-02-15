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

    public record PasajerosResponse(
        Resumen Horario,
        List<PasajeroModel.Response> Pasajeros);

    public record AsignacionRequest(
        List<int> PasajeroIds);
}
