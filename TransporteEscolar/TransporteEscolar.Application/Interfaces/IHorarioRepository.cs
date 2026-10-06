using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IHorarioRepository
{
    /// <summary>Devuelve los horarios activos con su colegio cargado, ordenados por <c>Orden</c>.</summary>
    Task<List<Horario>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Devuelve todos los horarios, activos e inactivos, con su colegio cargado.</summary>
    Task<List<Horario>> GetTodosAsync(CancellationToken cancellationToken = default);

    /// <summary>Busca un horario por id sin filtrar por <c>Activo</c> (hace falta para reactivar y editar).</summary>
    Task<Horario?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Indica si existe un horario <b>activo</b> con ese id.</summary>
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Devuelve los horarios activos con su colegio cargado. Se usa en el cálculo de recorridos
    /// para no hacer una consulta por horario.
    /// </summary>
    Task<List<Horario>> GetConColegioAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// De los ids indicados, devuelve solo los horarios que están inactivos (con su colegio cargado).
    /// Sirve para impedir reactivar pasajeros asignados a un horario dado de baja.
    /// </summary>
    Task<List<Horario>> GetInactivosPorIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default);

    /// <summary>Indica si ya hay un horario activo con esa etiqueta (sin distinguir mayúsculas), ignorando <paramref name="excluirId"/>.</summary>
    Task<bool> ExisteEtiquetaActivaAsync(string etiqueta, int? excluirId, CancellationToken cancellationToken = default);

    Task AddAsync(Horario horario, CancellationToken cancellationToken = default);

    /// <summary>Devuelve el mayor <c>Orden</c> entre todos los horarios (inactivos incluidos) más uno, o 1 si no hay ninguno.</summary>
    Task<int> GetSiguienteOrdenAsync(CancellationToken cancellationToken = default);

    Task UpdateAsync(Horario horario, CancellationToken cancellationToken = default);
}
