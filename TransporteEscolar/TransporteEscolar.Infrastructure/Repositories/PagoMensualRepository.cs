using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class PagoMensualRepository : IPagoMensualRepository
{
    private readonly AppDbContext _context;

    public PagoMensualRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagoMensual?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<List<PagoMensual>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .OrderByDescending(p => p.Anio)
            .ThenByDescending(p => p.Mes)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PagoMensual>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .Where(p => p.TitularId == titularId)
            .OrderByDescending(p => p.Anio)
            .ThenByDescending(p => p.Mes)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PagoMensual>> GetVencidosAsync(CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.UtcNow;
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .Where(p => p.FechaVencimiento < ahora)
            .OrderBy(p => p.FechaVencimiento)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PagoMensual>> GetPendientesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagoMensual?> GetByTitularMesAnioAsync(int titularId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .FirstOrDefaultAsync(p => p.TitularId == titularId && p.Mes == mes && p.Anio == anio, cancellationToken);
    }

    public async Task<PagoMensual> AddAsync(PagoMensual pagoMensual, CancellationToken cancellationToken = default)
    {
        _context.PagosMensuales.Add(pagoMensual);
        await _context.SaveChangesAsync(cancellationToken);
        return pagoMensual;
    }

    public async Task UpdateAsync(PagoMensual pagoMensual, CancellationToken cancellationToken = default)
    {
        _context.PagosMensuales.Update(pagoMensual);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales.AnyAsync(p => p.Id == id, cancellationToken);
    }
}
