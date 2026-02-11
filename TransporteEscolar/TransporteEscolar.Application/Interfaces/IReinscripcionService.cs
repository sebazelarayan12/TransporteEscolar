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
}
