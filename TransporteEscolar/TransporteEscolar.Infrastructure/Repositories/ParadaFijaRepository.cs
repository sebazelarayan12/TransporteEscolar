using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class ParadaFijaRepository : IParadaFijaRepository
{
    private readonly AppDbContext _context;

    public ParadaFijaRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ParadaFija>> GetTodasAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ParadasFijas
            .ToListAsync(cancellationToken);
    }

    public async Task<ParadaFija?> GetAsync(int horarioId, byte transporte, CancellationToken cancellationToken = default)
    {
        return await _context.ParadasFijas
            .FirstOrDefaultAsync(p => p.HorarioId == horarioId && p.Transporte == transporte, cancellationToken);
    }

    public async Task<ParadaFija> UpsertAsync(ParadaFija paradaFija, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(paradaFija);

        var existente = await _context.ParadasFijas
            .FirstOrDefaultAsync(
                p => p.HorarioId == paradaFija.HorarioId && p.Transporte == paradaFija.Transporte,
                cancellationToken);

        if (existente is null)
        {
            await _context.ParadasFijas.AddAsync(paradaFija, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return paradaFija;
        }

        existente.ReasignarTitular(paradaFija.TitularId);

        await _context.SaveChangesAsync(cancellationToken);
        return existente;
    }

    public async Task EliminarAsync(int horarioId, byte transporte, CancellationToken cancellationToken = default)
    {
        var existente = await _context.ParadasFijas
            .FirstOrDefaultAsync(p => p.HorarioId == horarioId && p.Transporte == transporte, cancellationToken);

        if (existente is null)
            return;

        _context.ParadasFijas.Remove(existente);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
