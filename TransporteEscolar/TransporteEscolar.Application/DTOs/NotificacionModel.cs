namespace TransporteEscolar.Application.DTOs;

public record NotificacionModel
{
    public record Response(
        int Id,
        string Tipo,
        string Titulo,
        string Mensaje,
        DateTime FechaCreacion,
        bool Leida,
        DateTime? FechaLectura,
        string? EntidadTipo,
        int? EntidadId
    );

    public record CountResponse(int Count);

    public record FilterRequest(
        int PageNumber = 1,
        int PageSize = 20,
        bool SoloNoLeidas = false
    );
}
