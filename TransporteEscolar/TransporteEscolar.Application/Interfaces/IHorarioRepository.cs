using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IHorarioRepository
{
    Task<List<Horario>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Horario?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Devuelve todos los horarios con su colegio cargado. Se usa en el cálculo de recorridos
    /// para no hacer una consulta por horario.
    /// </summary>
    Task<List<Horario>> GetConColegioAsync(CancellationToken cancellationToken = default);
}
