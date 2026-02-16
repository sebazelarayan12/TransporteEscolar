using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class PasajeroHorarioRepository : IPasajeroHorarioRepository
{
    private readonly AppDbContext _context;

    public PasajeroHorarioRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PasajeroHorario?> GetAsync(int pasajeroId, int horarioId, CancellationToken cancellationToken = default)
    {
        return await _context.PasajeroHorarios
            .Include(ph => ph.Horario)
            .FirstOrDefaultAsync(ph => ph.PasajeroId == pasajeroId && ph.HorarioId == horarioId, cancellationToken);
    }

    public async Task<List<PasajeroHorario>> GetByPasajeroIdAsync(int pasajeroId, CancellationToken cancellationToken = default)
    {
        return await _context.PasajeroHorarios
            .Include(ph => ph.Horario)
            .Where(ph => ph.PasajeroId == pasajeroId)
            .OrderBy(ph => ph.Prioridad)
            .ThenBy(ph => ph.FechaAsignacion)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PasajeroHorario>> GetByPasajeroIdsAsync(IEnumerable<int> pasajeroIds, CancellationToken cancellationToken = default)
    {
        var ids = pasajeroIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new List<PasajeroHorario>();
        }

        return await _context.PasajeroHorarios
            .Include(ph => ph.Horario)
            .Where(ph => ids.Contains(ph.PasajeroId))
            .ToListAsync(cancellationToken);
    }

    public async Task<PasajeroHorario> AddAsync(PasajeroHorario asignacion, CancellationToken cancellationToken = default)
    {
        _context.PasajeroHorarios.Add(asignacion);
        await _context.SaveChangesAsync(cancellationToken);
        return asignacion;
    }

    public async Task UpdateAsync(PasajeroHorario asignacion, CancellationToken cancellationToken = default)
    {
        _context.PasajeroHorarios.Update(asignacion);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateRangeAsync(IEnumerable<PasajeroHorario> asignaciones, CancellationToken cancellationToken = default)
    {
        _context.PasajeroHorarios.UpdateRange(asignaciones);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(PasajeroHorario asignacion, CancellationToken cancellationToken = default)
    {
        _context.PasajeroHorarios.Remove(asignacion);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> ObtenerSiguientePrioridadAsync(int pasajeroId, CancellationToken cancellationToken = default)
    {
        var max = await _context.PasajeroHorarios
            .Where(ph => ph.PasajeroId == pasajeroId)
            .Select(ph => (int?)ph.Prioridad)
            .MaxAsync(cancellationToken);

        return max.HasValue ? max.Value + 1 : 1;
    }

    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(action);

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await action();
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
