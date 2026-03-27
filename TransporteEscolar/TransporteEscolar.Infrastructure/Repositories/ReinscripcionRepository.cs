using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class ReinscripcionRepository : IReinscripcionRepository
{
    private readonly AppDbContext _context;

    public ReinscripcionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ReinscripcionPasajero?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ReinscripcionesPasajeros
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<ReinscripcionPasajero?> GetByIdConDetallesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ReinscripcionesPasajeros
            .Include(r => r.Pasajero)
                .ThenInclude(p => p.Titular)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    /// <summary>
    /// Obtiene todas las reinscripciones ordenadas por fecha para titulares activos.
    /// </summary>
    public async Task<List<ReinscripcionPasajero>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await SoloTitularesActivos(_context.ReinscripcionesPasajeros)
            .OrderByDescending(r => r.FechaCreacion)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Devuelve las reinscripciones del año indicado excluyendo titulares dados de baja.
    /// </summary>
    public async Task<List<ReinscripcionPasajero>> GetByAnioAsync(int anio, CancellationToken cancellationToken = default)
    {
        return await SoloTitularesActivos(_context.ReinscripcionesPasajeros)
            .Where(r => r.Anio == anio)
            .OrderByDescending(r => r.FechaCreacion)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Obtiene las reinscripciones con detalles de pasajero/titular únicamente para titulares activos.
    /// </summary>
    public async Task<List<ReinscripcionPasajero>> GetByAnioConDetallesAsync(int anio, CancellationToken cancellationToken = default)
    {
        var query = _context.ReinscripcionesPasajeros
            .Include(r => r.Pasajero)
                .ThenInclude(p => p.Titular)
            .Where(r => r.Anio == anio);

        query = SoloTitularesActivos(query);

        return await query
            .OrderByDescending(r => r.FechaCreacion)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Devuelve resultados paginados por año/mes solo para titulares activos.
    /// </summary>
    public async Task<(List<ReinscripcionPasajero> Reinscripciones, int TotalCount)> GetByAnioConDetallesPaginadoAsync(
        int anio,
        int mes,
        string? estado,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ReinscripcionesPasajeros
            .Include(r => r.Pasajero)
                .ThenInclude(p => p.Titular)
            .Where(r => r.Anio == anio);

        query = SoloTitularesActivos(query);

        if (mes is >= 1 and <= 12)
        {
            query = query.Where(r => r.FechaCreacion.Month == mes);
        }

        if (!string.IsNullOrEmpty(estado))
        {
            query = query.Where(r => r.Estado == estado);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var data = await query
            .OrderByDescending(r => r.FechaCreacion)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (data, totalCount);
    }

    public async Task<bool> ExisteParaPasajeroYAnioAsync(int pasajeroId, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.ReinscripcionesPasajeros
            .AnyAsync(r => r.PasajeroId == pasajeroId && r.Anio == anio, cancellationToken);
    }

    public async Task<ReinscripcionPasajero> AddAsync(ReinscripcionPasajero reinscripcion, CancellationToken cancellationToken = default)
    {
        _context.ReinscripcionesPasajeros.Add(reinscripcion);
        await _context.SaveChangesAsync(cancellationToken);
        return reinscripcion;
    }

    public async Task UpdateAsync(ReinscripcionPasajero reinscripcion, CancellationToken cancellationToken = default)
    {
        _context.ReinscripcionesPasajeros.Update(reinscripcion);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static IQueryable<ReinscripcionPasajero> SoloTitularesActivos(IQueryable<ReinscripcionPasajero> query)
    {
        return query.Where(r => r.Pasajero != null && r.Pasajero.Titular != null && r.Pasajero.Titular.FechaBaja == null);
    }
}
