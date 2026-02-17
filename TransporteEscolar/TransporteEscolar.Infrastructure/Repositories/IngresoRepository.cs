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
}
