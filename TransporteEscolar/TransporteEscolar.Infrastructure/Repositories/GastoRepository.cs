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
}
