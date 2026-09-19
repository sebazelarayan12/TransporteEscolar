using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class TitularUbicacionRepository : ITitularUbicacionRepository
{
    private readonly AppDbContext _context;

    public TitularUbicacionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TitularUbicacion?> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        return await _context.TitularesUbicaciones
            .FirstOrDefaultAsync(u => u.TitularId == titularId, cancellationToken);
    }

    public async Task<List<TitularUbicacion>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.TitularesUbicaciones
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TitularUbicacion>> GetByTitularIdsAsync(
        IReadOnlyCollection<int> titularIds,
        CancellationToken cancellationToken = default)
    {
        if (titularIds is null || titularIds.Count == 0)
            return new List<TitularUbicacion>();

        return await _context.TitularesUbicaciones
            .Where(u => titularIds.Contains(u.TitularId))
            .ToListAsync(cancellationToken);
    }

    public async Task<TitularUbicacion> UpsertAsync(TitularUbicacion ubicacion, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(ubicacion);

        var existente = await _context.TitularesUbicaciones
            .FirstOrDefaultAsync(u => u.TitularId == ubicacion.TitularId, cancellationToken);

        if (existente is null)
        {
            await _context.TitularesUbicaciones.AddAsync(ubicacion, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return ubicacion;
        }

        existente.Mover(
            ubicacion.Latitud,
            ubicacion.Longitud,
            ubicacion.DireccionNormalizada,
            ubicacion.Fuente);

        await _context.SaveChangesAsync(cancellationToken);
        return existente;
    }

    public async Task DeleteByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        var existente = await _context.TitularesUbicaciones
            .FirstOrDefaultAsync(u => u.TitularId == titularId, cancellationToken);

        if (existente is null)
            return;

        _context.TitularesUbicaciones.Remove(existente);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
