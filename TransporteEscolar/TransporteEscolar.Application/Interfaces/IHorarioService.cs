using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IHorarioService
{
    Task<List<HorarioModel.Response>> ObtenerHorariosAsync(CancellationToken cancellationToken = default);
    Task<HorarioModel.PasajerosResponse> ObtenerPasajerosPorHorarioAsync(int horarioId, CancellationToken cancellationToken = default);
    Task AsignarPasajerosAsync(int horarioId, HorarioModel.AsignacionRequest request, CancellationToken cancellationToken = default);
}
