using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class RecorridoRepository : IRecorridoRepository
{
    private readonly AppDbContext _context;

    public RecorridoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Recorrido?> GetByTitularYColegioAsync(
        int titularId,
        int colegioId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Recorridos
            .Include(r => r.Colegio)
            .FirstOrDefaultAsync(r => r.TitularId == titularId && r.ColegioId == colegioId, cancellationToken);
    }

    public async Task<List<Recorrido>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        return await _context.Recorridos
            .Include(r => r.Colegio)
            .Where(r => r.TitularId == titularId)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Recorrido>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Recorridos
            .Include(r => r.Colegio)
            .ToListAsync(cancellationToken);
    }

    public async Task<Recorrido> UpsertAsync(Recorrido recorrido, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(recorrido);

        var existente = await _context.Recorridos
            .FirstOrDefaultAsync(
                r => r.TitularId == recorrido.TitularId && r.ColegioId == recorrido.ColegioId,
                cancellationToken);

        if (existente is null)
        {
            await _context.Recorridos.AddAsync(recorrido, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return recorrido;
        }

        existente.Actualizar(
            recorrido.DistanciaMetros,
            recorrido.DuracionSegundos,
            recorrido.GeometriaPolyline,
            recorrido.HashOrigenDestino);

        await _context.SaveChangesAsync(cancellationToken);
        return existente;
    }

    public async Task DeleteByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        var recorridos = await _context.Recorridos
            .Where(r => r.TitularId == titularId)
            .ToListAsync(cancellationToken);

        if (recorridos.Count == 0)
            return;

        _context.Recorridos.RemoveRange(recorridos);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
