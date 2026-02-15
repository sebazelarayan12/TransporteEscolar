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
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .Include(p => p.Reinscripciones)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<List<Pasajero>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .OrderBy(p => p.Titular.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetActivosAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .Where(p => p.FechaBaja == null)
            .OrderBy(p => p.Titular.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetActivosDisponiblesParaReinscripcionAsync(int anio, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .Include(p => p.Reinscripciones)
            .Where(p => p.FechaBaja == null)
            .Where(p => !p.Reinscripciones.Any(r =>
                r.Anio == anio && (r.Estado == "Confirmado" || r.Estado == "Pendiente" || r.Estado == "NoContinua")))
            .OrderBy(p => p.Titular.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .Include(p => p.Reinscripciones)
            .Where(p => p.TitularId == titularId)
            .OrderBy(p => p.Titular.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetActivosPorHorarioAsync(int horarioId, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .Where(p => p.PasajeroHorarios.Any(ph => ph.HorarioId == horarioId))
            .Where(p => p.FechaBaja == null)
            .OrderBy(p => p.Titular.Apellido)
            .ThenBy(p => p.Nombre)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Pasajero>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
    {
        var idsList = ids.Distinct().ToList();
        if (idsList.Count == 0)
            return new List<Pasajero>();

        return await _context.Pasajeros
            .Include(p => p.Titular)
            .Include(p => p.PasajeroHorarios)
                .ThenInclude(ph => ph.Horario)
            .Where(p => idsList.Contains(p.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<int, int>> GetActivosCountByHorarioAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PasajeroHorarios
            .Where(ph => ph.Pasajero.FechaBaja == null)
            .GroupBy(ph => ph.HorarioId)
            .Select(group => new { HorarioId = group.Key, Total = group.Count() })
            .ToDictionaryAsync(x => x.HorarioId, x => x.Total, cancellationToken);
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

    public async Task UpdateRangeAsync(IEnumerable<Pasajero> pasajeros, CancellationToken cancellationToken = default)
    {
        _context.Pasajeros.UpdateRange(pasajeros);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros.AnyAsync(p => p.Id == id, cancellationToken);
    }
}
