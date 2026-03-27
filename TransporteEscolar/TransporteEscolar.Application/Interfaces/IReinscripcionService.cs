using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IReinscripcionService
{
    Task<PaginationModel.ResponsePagination<ReinscripcionModel.ResponseDetallada>> ObtenerTodosAsync(ReinscripcionModel.FilterRequest request);
    Task<ReinscripcionModel.ResponseDetallada> ObtenerPorIdAsync(int id);
    Task<ReinscripcionModel.ResponseDetallada> CrearAsync(int pasajeroId, int anio);
    Task ConfirmarAsync(int id);
    Task MarcarComoNoContinuaAsync(int id);
    Task MarcarComoPendienteAsync(int id);
    Task<ReinscripcionModel.PrecioPrevioResponse> ObtenerPrecioPrevioAsync(int id);
    /// <summary>
    /// Obtiene alertas de pago agrupadas por estado para titulares activos con pendientes,
    /// incluyendo tanto las reinscripciones en estado "Pendiente" como los pasajeros que aún no
    /// generaron su reinscripción en el año indicado.
    /// </summary>
    Task<ReinscripcionModel.AlertasPagoResponse> ObtenerAlertasPagoAsync(int anio);
}
