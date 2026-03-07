using System;
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
        var hoy = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .Where(p => p.FechaVencimiento < hoy)
            .OrderBy(p => p.FechaVencimiento)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PagoMensual>> GetPendientesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .Where(p => (p.Movimientos.Sum(m => (decimal?)m.Monto) ?? 0m) < p.MontoGenerado)
            .OrderBy(p => p.Anio)
            .ThenBy(p => p.Mes)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagoMensual?> GetByTitularMesAnioAsync(int titularId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .FirstOrDefaultAsync(p => p.TitularId == titularId && p.Mes == mes && p.Anio == anio, cancellationToken);
    }

    public async Task<List<PagoMensual>> GetByMesAnioAsync(int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Titular)
            .Include(p => p.Movimientos)
            .Where(p => p.Mes == mes && p.Anio == anio)
            .OrderBy(p => p.Titular.Apellido)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<PagoMovimiento> Movimientos, int TotalCount)> ObtenerMovimientosAsync(
        DateTimeOffset fechaDesde,
        DateTimeOffset fechaHasta,
        int? titularId,
        string? medioPago,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePageNumber = Math.Max(pageNumber, 1);
        var safePageSize = Math.Max(pageSize, 1);

        var movimientosQuery = _context.PagosMovimientos
            .AsNoTracking()
            .Include(m => m.PagoMensual)
                .ThenInclude(p => p.Titular)
            .Where(m => m.FechaPago >= fechaDesde && m.FechaPago < fechaHasta);

        if (titularId.HasValue)
        {
            movimientosQuery = movimientosQuery.Where(m => m.PagoMensual != null && m.PagoMensual.TitularId == titularId.Value);
        }

        if (!string.IsNullOrWhiteSpace(medioPago))
        {
            var normalizedMedioPago = medioPago.Trim().ToUpper();
            movimientosQuery = movimientosQuery.Where(m => m.MedioPago.ToUpper() == normalizedMedioPago);
        }

        var totalCount = await movimientosQuery.CountAsync(cancellationToken);

        var orderedQuery = movimientosQuery
            .OrderByDescending(m => m.FechaPago)
            .ThenByDescending(m => m.Id);

        var movimientos = await orderedQuery
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (movimientos, totalCount);
    }

    public async Task<PagoMovimiento?> GetMovimientoByIdAsync(int movimientoId, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMovimientos
            .Include(m => m.PagoMensual)
                .ThenInclude(p => p.Titular)
            .FirstOrDefaultAsync(m => m.Id == movimientoId, cancellationToken);
    }

    public async Task<(List<Titular> Titulares, int TotalCount)> GetTitularesConPagosAsync(
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePageNumber = Math.Max(pageNumber, 1);
        var safePageSize = Math.Max(pageSize, 1);

        var titularesQuery = _context.PagosMensuales
            .AsNoTracking()
            .Where(p => p.Titular != null && p.Titular.FechaBaja == null)
            .Select(p => p.Titular)
            .Distinct();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = $"%{search.Trim().ToLower()}%";
            titularesQuery = titularesQuery.Where(t =>
                EF.Functions.Like(t.Apellido.ToLower(), normalizedSearch) ||
                EF.Functions.Like(t.NombreContacto.ToLower(), normalizedSearch) ||
                EF.Functions.Like(t.Direccion.ToLower(), normalizedSearch));
        }

        var totalCount = await titularesQuery.CountAsync(cancellationToken);

        var titulares = await titularesQuery
            .OrderBy(t => t.Apellido)
            .ThenBy(t => t.NombreContacto)
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (titulares, totalCount);
    }

    public async Task DeleteByTitularIdAsync(int titularId, CancellationToken cancellationToken = default)
    {
        await _context.PagosMensuales
            .Where(p => p.TitularId == titularId)
            .ExecuteDeleteAsync(cancellationToken);
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
