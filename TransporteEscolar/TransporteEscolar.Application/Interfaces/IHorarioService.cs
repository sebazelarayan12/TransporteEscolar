using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IHorarioService
{
    Task<List<HorarioModel.Response>> ObtenerHorariosAsync(bool incluirInactivos = false, CancellationToken cancellationToken = default);
    Task<HorarioModel.Response> CrearAsync(HorarioModel.CrearRequest request, CancellationToken cancellationToken = default);
    Task<HorarioModel.Response> ActualizarAsync(int id, HorarioModel.ActualizarRequest request, CancellationToken cancellationToken = default);
    Task DesactivarAsync(int id, CancellationToken cancellationToken = default);
    Task ReactivarAsync(int id, CancellationToken cancellationToken = default);
    Task<HorarioModel.PasajerosResponse> ObtenerPasajerosPorHorarioAsync(int horarioId, CancellationToken cancellationToken = default);
    Task AsignarPasajerosAsync(int horarioId, HorarioModel.AsignacionRequest request, CancellationToken cancellationToken = default);
}
