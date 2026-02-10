using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IPasajeroService
{
    Task<PasajeroModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<PasajeroModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<List<PasajeroModel.Response>> ObtenerActivosAsync(CancellationToken cancellationToken = default);
    Task<List<PasajeroModel.Response>> ObtenerActivosDisponiblesParaReinscripcionAsync(int anio, CancellationToken cancellationToken = default);
    Task<PaginationModel.ResponsePagination<PasajeroModel.Response>> ObtenerPaginadosAsync(PaginationModel.FilterRequest request, CancellationToken cancellationToken = default);
    Task<List<PasajeroModel.Response>> ObtenerPorTitularAsync(int titularId, CancellationToken cancellationToken = default);
    Task<PasajeroModel.Response> CrearAsync(PasajeroModel.Request dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, PasajeroModel.UpdateRequest dto, CancellationToken cancellationToken = default);
    Task DarDeBajaAsync(int id, CancellationToken cancellationToken = default);
    Task ReactivarAsync(int id, CancellationToken cancellationToken = default);
    
    // Gestión de reinscripciones
    Task<List<ReinscripcionModel.Response>> ObtenerReinscripcionesAsync(int pasajeroId, CancellationToken cancellationToken = default);
    Task<ReinscripcionModel.Response> CrearReinscripcionAsync(int pasajeroId, ReinscripcionModel.Request dto, CancellationToken cancellationToken = default);
    Task ConfirmarReinscripcionAsync(int pasajeroId, int reinscripcionId, CancellationToken cancellationToken = default);
    Task MarcarComoNoContinuaAsync(int pasajeroId, int reinscripcionId, CancellationToken cancellationToken = default);
}
