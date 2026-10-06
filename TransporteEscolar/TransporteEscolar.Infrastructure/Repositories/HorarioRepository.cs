using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class HorarioRepository : IHorarioRepository
{
    private readonly AppDbContext _context;

    public HorarioRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Horario>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Horarios
            .Include(h => h.Colegio)
            .Where(h => h.Activo)
            .OrderBy(h => h.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Horario>> GetTodosAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Horarios
            .Include(h => h.Colegio)
            .OrderBy(h => h.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<Horario?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Horarios
            .Include(h => h.Colegio)
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
    }

    public async Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Horarios.AnyAsync(h => h.Id == id && h.Activo, cancellationToken);
    }

    public async Task<List<Horario>> GetConColegioAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Horarios
            .Include(h => h.Colegio)
            .Where(h => h.Activo)
            .OrderBy(h => h.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Horario>> GetInactivosPorIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
    {
        var idsLista = ids.Distinct().ToList();
        if (idsLista.Count == 0)
            return new List<Horario>();

        return await _context.Horarios
            .Include(h => h.Colegio)
            .Where(h => idsLista.Contains(h.Id) && !h.Activo)
            .OrderBy(h => h.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExisteEtiquetaActivaAsync(string etiqueta, int? excluirId, CancellationToken cancellationToken = default)
    {
        var normalizada = etiqueta.Trim().ToLower();

        return await _context.Horarios.AnyAsync(
            h => h.Activo
                 && (excluirId == null || h.Id != excluirId)
                 && h.Etiqueta.ToLower() == normalizada,
            cancellationToken);
    }

    public async Task AddAsync(Horario horario, CancellationToken cancellationToken = default)
    {
        _context.Horarios.Add(horario);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> GetSiguienteOrdenAsync(CancellationToken cancellationToken = default)
    {
        var maximo = await _context.Horarios.MaxAsync(h => (int?)h.Orden, cancellationToken);
        return (maximo ?? 0) + 1;
    }

    public async Task UpdateAsync(Horario horario, CancellationToken cancellationToken = default)
    {
        _context.Horarios.Update(horario);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
