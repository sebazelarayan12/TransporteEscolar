namespace TransporteEscolar.Application.DTOs;

public static class WhatsAppLoteModel
{
    /// <summary>Request para disparar un lote nuevo desde el frontend.</summary>
    public record CrearRequest(
        string Descripcion,
        // Si está vacío => se notifica a TODOS los titulares activos
        List<int>? TitularIds = null
    );

    /// <summary>Respuesta inmediata al crear el lote (202 Accepted).</summary>
    public record Response(
        int LoteId,
        string Estado,
        int TotalMensajes,
        DateTime FechaCreacion
    );

    /// <summary>Polling del estado del lote desde el frontend.</summary>
    public record EstadoResponse(
        int LoteId,
        string Estado,
        int Total,
        int Enviados,
        int Entregados,
        int Leidos,
        int Errores,
        int Pendientes,
        DateTime FechaCreacion,
        DateTime? FechaFinalizacion
    );
}
