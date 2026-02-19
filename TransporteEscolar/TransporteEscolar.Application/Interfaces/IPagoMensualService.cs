using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IPagoMensualService
{
    Task<PagoMensualModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<PagoMensualModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<List<PagoMensualModel.Response>> ObtenerPorTitularAsync(int titularId, CancellationToken cancellationToken = default);
    Task<List<PagoMensualModel.Response>> ObtenerVencidosAsync(CancellationToken cancellationToken = default);
    Task<List<PagoMensualModel.Response>> ObtenerPendientesAsync(CancellationToken cancellationToken = default);
    Task<PaginationModel.ResponsePagination<PagoMensualModel.Response>> ObtenerPaginadosAsync(PagoMensualModel.FilterRequest request, CancellationToken cancellationToken = default);
    Task<PaginationModel.ResponsePagination<TitularModel.Response>> ObtenerTitularesConPagosAsync(PaginationModel.FilterRequest request, CancellationToken cancellationToken = default);
    Task<PaginationModel.ResponsePagination<PagoMovimientoModel.Response>> ObtenerMovimientosAsync(PagoMovimientoModel.FilterRequest request, CancellationToken cancellationToken = default);
    Task<PagoMensualModel.EstadisticasMes> ObtenerEstadisticasMesAsync(int mes, int anio, CancellationToken cancellationToken = default);
    Task<PagoMensualModel.Response> CrearAsync(PagoMensualModel.Request dto, CancellationToken cancellationToken = default);
    Task RegistrarPagoAsync(int pagoMensualId, PagoMensualModel.RegistrarPagoRequest dto, CancellationToken cancellationToken = default);
    Task<PagoMovimientoModel.Response> EliminarMovimientoAsync(int pagoMensualId, int movimientoId, CancellationToken cancellationToken = default);
    Task ActualizarObservacionesAsync(int id, PagoMensualModel.UpdateObservacionesRequest dto, CancellationToken cancellationToken = default);
    Task<PagoMensualModel.AjusteTitularResponse> AjustarMontoTitularAsync(int titularId, PagoMensualModel.AjusteTitularRequest request, CancellationToken cancellationToken = default);
    Task GenerarPagosMensualesAutomaticosAsync(int titularId, int anio, CancellationToken cancellationToken = default);
}
