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
            .OrderBy(h => h.Orden)
            .ToListAsync(cancellationToken);
    }

    public async Task<Horario?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Horarios
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
    }

    public async Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Horarios.AnyAsync(h => h.Id == id, cancellationToken);
    }
}
