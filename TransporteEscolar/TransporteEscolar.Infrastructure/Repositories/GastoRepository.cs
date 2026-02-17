using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class GastoRepository : IGastoRepository
{
    private readonly AppDbContext _context;

    public GastoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GastoMensual>> ObtenerGastosPorMesAsync(int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.GastosMensuales
            .AsNoTracking()
            .Where(g => g.Mes == mes && g.Anio == anio)
            .OrderBy(g => g.Fecha)
            .ThenBy(g => g.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<GastoMensual>> ObtenerGastosPorTipoAsync(int mes, int anio, string tipo, CancellationToken cancellationToken = default)
    {
        return await _context.GastosMensuales
            .AsNoTracking()
            .Where(g => g.Mes == mes && g.Anio == anio && g.Tipo == tipo)
            .OrderBy(g => g.Fecha)
            .ThenBy(g => g.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<GastoMensual> AgregarGastoMensualAsync(GastoMensual gasto, CancellationToken cancellationToken = default)
    {
        _context.GastosMensuales.Add(gasto);
        await _context.SaveChangesAsync(cancellationToken);
        return gasto;
    }

    public async Task<GastoFijoTemplate> AgregarTemplateAsync(GastoFijoTemplate template, CancellationToken cancellationToken = default)
    {
        _context.GastosFijosTemplates.Add(template);
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<List<GastoFijoTemplate>> ObtenerTemplatesActivosHastaMesAsync(DateTime fechaLimite, CancellationToken cancellationToken = default)
    {
        return await _context.GastosFijosTemplates
            .AsNoTracking()
            .Where(t => t.EstaActivo && t.FechaInicio <= fechaLimite)
            .OrderBy(t => t.FechaInicio)
            .ThenBy(t => t.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExisteGastoMensualParaTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.GastosMensuales
            .AnyAsync(g => g.GastoFijoTemplateId == templateId && g.Mes == mes && g.Anio == anio, cancellationToken);
    }

    public async Task<GastoFijoTemplate?> ObtenerTemplatePorIdAsync(int templateId, CancellationToken cancellationToken = default)
    {
        return await _context.GastosFijosTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId, cancellationToken);
    }

    public async Task<GastoFijoTemplate> ActualizarTemplateAsync(GastoFijoTemplate template, CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<GastoMensual?> ObtenerGastoMensualPorTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.GastosMensuales
            .FirstOrDefaultAsync(g => g.GastoFijoTemplateId == templateId && g.Mes == mes && g.Anio == anio, cancellationToken);
    }

    public async Task<GastoMensual?> ObtenerGastoMensualPorIdAsync(int gastoId, CancellationToken cancellationToken = default)
    {
        return await _context.GastosMensuales
            .FirstOrDefaultAsync(g => g.Id == gastoId, cancellationToken);
    }

    public async Task<GastoMensual> ActualizarGastoMensualAsync(GastoMensual gasto, CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
        return gasto;
    }

    public async Task EliminarGastoMensualAsync(GastoMensual gasto, CancellationToken cancellationToken = default)
    {
        _context.GastosMensuales.Remove(gasto);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<GastoMensual>> GetFuturosPorTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.GastosMensuales
            .Where(g => g.GastoFijoTemplateId == templateId &&
                        (g.Anio > anio || (g.Anio == anio && g.Mes >= mes)))
            .OrderBy(g => g.Anio)
            .ThenBy(g => g.Mes)
            .ThenBy(g => g.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task BulkUpdateAsync(IEnumerable<GastoMensual> gastos, CancellationToken cancellationToken = default)
    {
        var entidades = gastos?.ToList() ?? new List<GastoMensual>();
        if (entidades.Count == 0)
        {
            return;
        }

        _context.GastosMensuales.UpdateRange(entidades);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> EliminarInstanciasFuturasPorTemplateAsync(int templateId, int mesCorte, int anioCorte, CancellationToken cancellationToken = default)
    {
        var instancias = await _context.GastosMensuales
            .Where(g => g.GastoFijoTemplateId == templateId &&
                        (g.Anio > anioCorte || (g.Anio == anioCorte && g.Mes >= mesCorte)))
            .ToListAsync(cancellationToken);

        if (instancias.Count == 0)
        {
            return 0;
        }

        _context.GastosMensuales.RemoveRange(instancias);
        await _context.SaveChangesAsync(cancellationToken);
        return instancias.Count;
    }
}
