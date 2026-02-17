using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class IngresoRepository : IIngresoRepository
{
    private readonly AppDbContext _context;

    public IngresoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<IngresoMensual>> ObtenerIngresosPorMesAsync(int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosMensuales
            .AsNoTracking()
            .Where(i => i.Mes == mes && i.Anio == anio)
            .OrderBy(i => i.Fecha)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IngresoMensual> AgregarIngresoMensualAsync(IngresoMensual ingreso, CancellationToken cancellationToken = default)
    {
        _context.IngresosMensuales.Add(ingreso);
        await _context.SaveChangesAsync(cancellationToken);
        return ingreso;
    }

    public async Task<IngresoFijoTemplate> AgregarTemplateAsync(IngresoFijoTemplate template, CancellationToken cancellationToken = default)
    {
        _context.IngresosFijosTemplates.Add(template);
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<List<IngresoFijoTemplate>> ObtenerTemplatesActivosHastaMesAsync(DateTime fechaLimite, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosFijosTemplates
            .AsNoTracking()
            .Where(t => t.EstaActivo && t.FechaInicio <= fechaLimite)
            .OrderBy(t => t.FechaInicio)
            .ThenBy(t => t.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExisteIngresoMensualParaTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosMensuales
            .AnyAsync(i => i.IngresoFijoTemplateId == templateId && i.Mes == mes && i.Anio == anio, cancellationToken);
    }

    public async Task<decimal> ObtenerTotalPorTipoAsync(int mes, int anio, string tipo, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosMensuales
            .AsNoTracking()
            .Where(i => i.Mes == mes && i.Anio == anio && i.Tipo == tipo)
            .SumAsync(i => i.Monto, cancellationToken);
    }

    public async Task<IngresoFijoTemplate?> ObtenerTemplatePorIdAsync(int templateId, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosFijosTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId, cancellationToken);
    }

    public async Task<IngresoFijoTemplate> ActualizarTemplateAsync(IngresoFijoTemplate template, CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<IngresoMensual?> ObtenerIngresoMensualPorTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosMensuales
            .FirstOrDefaultAsync(i => i.IngresoFijoTemplateId == templateId && i.Mes == mes && i.Anio == anio, cancellationToken);
    }

    public async Task<IngresoMensual?> ObtenerIngresoMensualPorIdAsync(int ingresoId, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosMensuales
            .FirstOrDefaultAsync(i => i.Id == ingresoId, cancellationToken);
    }

    public async Task<IngresoMensual> ActualizarIngresoMensualAsync(IngresoMensual ingreso, CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
        return ingreso;
    }

    public async Task EliminarIngresoMensualAsync(IngresoMensual ingreso, CancellationToken cancellationToken = default)
    {
        _context.IngresosMensuales.Remove(ingreso);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<IngresoMensual>> GetFuturosPorTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.IngresosMensuales
            .Where(i => i.IngresoFijoTemplateId == templateId &&
                        (i.Anio > anio || (i.Anio == anio && i.Mes >= mes)))
            .OrderBy(i => i.Anio)
            .ThenBy(i => i.Mes)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task BulkUpdateAsync(IEnumerable<IngresoMensual> ingresos, CancellationToken cancellationToken = default)
    {
        var entidades = ingresos?.ToList() ?? new List<IngresoMensual>();
        if (entidades.Count == 0)
        {
            return;
        }

        _context.IngresosMensuales.UpdateRange(entidades);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> EliminarInstanciasFuturasPorTemplateAsync(int templateId, int mesCorte, int anioCorte, CancellationToken cancellationToken = default)
    {
        var instancias = await _context.IngresosMensuales
            .Where(i => i.IngresoFijoTemplateId == templateId &&
                        (i.Anio > anioCorte || (i.Anio == anioCorte && i.Mes >= mesCorte)))
            .ToListAsync(cancellationToken);

        if (instancias.Count == 0)
        {
            return 0;
        }

        _context.IngresosMensuales.RemoveRange(instancias);
        await _context.SaveChangesAsync(cancellationToken);
        return instancias.Count;
    }
}
