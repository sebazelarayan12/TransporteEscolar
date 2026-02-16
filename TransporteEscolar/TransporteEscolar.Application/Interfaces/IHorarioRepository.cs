using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IHorarioRepository
{
    Task<List<Horario>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Horario?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);
}
