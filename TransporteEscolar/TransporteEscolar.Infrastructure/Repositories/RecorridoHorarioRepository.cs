using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class RecorridoHorarioRepository : IRecorridoHorarioRepository
{
    private readonly AppDbContext _context;

    public RecorridoHorarioRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<RecorridoHorario>> GetAllConAportesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.RecorridosHorario
            .Include(r => r.Aportes)
            .ToListAsync(cancellationToken);
    }

    public async Task UpsertAsync(RecorridoHorario snapshot, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        var existente = await _context.RecorridosHorario
            .Include(r => r.Aportes)
            .FirstOrDefaultAsync(
                r => r.HorarioId == snapshot.HorarioId && r.Transporte == snapshot.Transporte,
                cancellationToken);

        if (existente is not null)
        {
            // Más simple y seguro que sincronizar hijo por hijo: se borra y se inserta de nuevo.
            // Se persiste el borrado antes del insert para respetar el índice único (HorarioId, Transporte).
            _context.RecorridosHorario.Remove(existente);
            await _context.SaveChangesAsync(cancellationToken);
        }

        await _context.RecorridosHorario.AddAsync(snapshot, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task LimpiarAsync(CancellationToken cancellationToken = default)
    {
        var todos = await _context.RecorridosHorario.ToListAsync(cancellationToken);

        if (todos.Count == 0)
            return;

        _context.RecorridosHorario.RemoveRange(todos);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
