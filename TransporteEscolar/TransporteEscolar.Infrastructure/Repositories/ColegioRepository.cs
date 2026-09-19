using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class ColegioRepository : IColegioRepository
{
    private readonly AppDbContext _context;

    public ColegioRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Colegio>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Colegios
            .Where(c => c.Activo)
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Colegio>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Colegios
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<Colegio?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Colegios
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Colegio?> GetByNombreAsync(string nombre, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            return null;

        var normalizado = nombre.Trim();

        // EF.Functions.ILike es específico de Npgsql y hace la comparación sin distinguir
        // mayúsculas directamente en PostgreSQL, sin traer todas las filas a memoria.
        return await _context.Colegios
            .FirstOrDefaultAsync(c => EF.Functions.ILike(c.Nombre, normalizado), cancellationToken);
    }

    public async Task UpdateAsync(Colegio colegio, CancellationToken cancellationToken = default)
    {
        _context.Colegios.Update(colegio);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
