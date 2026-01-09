using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class TitularRepository : ITitularRepository
{
    private readonly AppDbContext _context;

    public TitularRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Titular?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Titulares
            .Include(t => t.Telefonos)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<Titular>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Titulares
            .OrderBy(t => t.Apellido)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Titular>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Titulares
            .Where(t => t.FechaBaja == null)
            .OrderBy(t => t.Apellido)
            .ToListAsync(cancellationToken);
    }

    public async Task<Titular> AddAsync(Titular titular, CancellationToken cancellationToken = default)
    {
        _context.Titulares.Add(titular);
        await _context.SaveChangesAsync(cancellationToken);
        return titular;
    }

    public async Task UpdateAsync(Titular titular, CancellationToken cancellationToken = default)
    {
        _context.Titulares.Update(titular);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Titulares.AnyAsync(t => t.Id == id, cancellationToken);
    }
}
