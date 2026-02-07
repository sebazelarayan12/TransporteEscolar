using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IReinscripcionService
{
    Task<List<ReinscripcionModel.ResponseDetallada>> ObtenerTodosAsync(int anio);
    Task<ReinscripcionModel.ResponseDetallada> ObtenerPorIdAsync(int id);
    Task<ReinscripcionModel.ResponseDetallada> CrearAsync(int pasajeroId, int anio);
    Task ConfirmarAsync(int id);
    Task MarcarComoNoContinuaAsync(int id);
}
