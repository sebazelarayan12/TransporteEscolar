using System.ComponentModel.DataAnnotations;

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
        int? EntidadId,
        bool EsActualizacionProducto,
        DateTime? FechaPublicacion,
        string? Link
    );

    public record CountResponse(int Count);

    public record FilterRequest(
        int PageNumber = 1,
        int PageSize = 20,
        bool SoloNoLeidas = false
    );

    public record ActualizacionRequest(
        [Required]
        [StringLength(100)]
        string Titulo,

        [Required]
        [StringLength(500)]
        string Descripcion,

        [Required]
        DateTime FechaPublicacion,

        [Url]
        [StringLength(300)]
        string? Link
    );
}
