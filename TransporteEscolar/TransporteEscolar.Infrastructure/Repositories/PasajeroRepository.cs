using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class PasajeroRepository : IPasajeroRepository
{
    private readonly AppDbContext _context;

    public PasajeroRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Pasajero?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<List<Pasajero>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .OrderBy(p => p.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Where(p => p.FechaBaja == null)
            .OrderBy(p => p.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Where(p => p.TitularId == titularId)
            .OrderBy(p => p.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<Pasajero> AddAsync(Pasajero pasajero, CancellationToken cancellationToken = default)
    {
        _context.Pasajeros.Add(pasajero);
        await _context.SaveChangesAsync(cancellationToken);
        return pasajero;
    }

    public async Task UpdateAsync(Pasajero pasajero, CancellationToken cancellationToken = default)
    {
        _context.Pasajeros.Update(pasajero);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros.AnyAsync(p => p.Id == id, cancellationToken);
    }
}
