using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class ConfirmacionDiciembreRepository : IConfirmacionDiciembreRepository
{
    private readonly AppDbContext _context;

    public ConfirmacionDiciembreRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> TienePasajerosActivosAsync(int titularId, CancellationToken cancellationToken = default)
    {
        return await _context.Pasajeros
            .AnyAsync(p => p.TitularId == titularId && p.FechaBaja == null, cancellationToken);
    }

    /// <summary>
    /// Tres consultas en lote (titulares, pasajeros, decisiones y cuotas del año) y el armado en memoria:
    /// evita N+1 y no depende de navegaciones inversas.
    /// </summary>
    public async Task<List<DiciembreTitularDatos>> GetListadoAsync(int anio, int? titularId, CancellationToken cancellationToken = default)
    {
        var titularesQuery = _context.Titulares
            .AsNoTracking()
            .Where(t => t.FechaBaja == null)
            .Where(t => _context.Pasajeros.Any(p => p.TitularId == t.Id && p.FechaBaja == null));

        if (titularId.HasValue)
        {
            titularesQuery = titularesQuery.Where(t => t.Id == titularId.Value);
        }

        var titulares = await titularesQuery
            .OrderBy(t => t.Apellido)
            .ThenBy(t => t.NombreContacto)
            .Select(t => new { t.Id, t.Apellido, t.NombreContacto, t.MontoMensualPactado })
            .ToListAsync(cancellationToken);

        if (titulares.Count == 0)
            return new List<DiciembreTitularDatos>();

        var ids = titulares.Select(t => t.Id).ToList();

        var pasajeros = await _context.Pasajeros
            .AsNoTracking()
            .Where(p => p.FechaBaja == null && ids.Contains(p.TitularId))
            .OrderBy(p => p.Nombre)
            .Select(p => new { p.TitularId, p.Nombre })
            .ToListAsync(cancellationToken);

        var confirmaciones = await _context.ConfirmacionesDiciembre
            .AsNoTracking()
            .Where(c => c.Anio == anio && ids.Contains(c.TitularId))
            .Select(c => new { c.TitularId, c.Va })
            .ToListAsync(cancellationToken);

        var cuotas = await _context.PagosMensuales
            .AsNoTracking()
            .Where(p => p.Mes == 12 && p.Anio == anio && ids.Contains(p.TitularId))
            .Select(p => new
            {
                p.Id,
                p.TitularId,
                p.MontoGenerado,
                TotalPagado = p.Movimientos.Sum(m => (decimal?)m.Monto) ?? 0m
            })
            .ToListAsync(cancellationToken);

        var pasajerosPorTitular = pasajeros
            .GroupBy(p => p.TitularId)
            .ToDictionary(g => g.Key, g => g.Select(p => p.Nombre).ToList());

        var vaPorTitular = confirmaciones.ToDictionary(c => c.TitularId, c => (bool?)c.Va);

        // Índice único (TitularId, Mes, Anio): a lo sumo una cuota mes 12 por titular y año.
        var cuotaPorTitular = cuotas.ToDictionary(c => c.TitularId);

        var resultado = new List<DiciembreTitularDatos>(titulares.Count);
        foreach (var titular in titulares)
        {
            var nombres = pasajerosPorTitular.TryGetValue(titular.Id, out var lista)
                ? lista
                : new List<string>();

            bool? va = vaPorTitular.TryGetValue(titular.Id, out var decision) ? decision : null;

            DiciembreCuotaDatos? cuota = cuotaPorTitular.TryGetValue(titular.Id, out var c)
                ? new DiciembreCuotaDatos(c.Id, c.MontoGenerado, c.TotalPagado)
                : null;

            resultado.Add(new DiciembreTitularDatos(
                titular.Id,
                titular.Apellido,
                titular.NombreContacto,
                titular.MontoMensualPactado,
                nombres,
                va,
                cuota));
        }

        return resultado;
    }

    /// <summary>Con seguimiento: el alta, la edición y la baja se guardan juntas en <see cref="GuardarCambiosAsync"/>.</summary>
    public async Task<ConfirmacionDiciembre?> GetConfirmacionAsync(int titularId, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.ConfirmacionesDiciembre
            .FirstOrDefaultAsync(c => c.TitularId == titularId && c.Anio == anio, cancellationToken);
    }

    /// <summary>
    /// Con seguimiento y con movimientos: sin ellos el handler no podría ver los pagos y borraría una cuota pagada
    /// (los movimientos tienen FK en cascada).
    /// </summary>
    public async Task<PagoMensual?> GetCuotaDiciembreAsync(int titularId, int anio, CancellationToken cancellationToken = default)
    {
        return await _context.PagosMensuales
            .Include(p => p.Movimientos)
            .FirstOrDefaultAsync(p => p.TitularId == titularId && p.Mes == 12 && p.Anio == anio, cancellationToken);
    }

    public void AgregarConfirmacion(ConfirmacionDiciembre confirmacion)
    {
        _context.ConfirmacionesDiciembre.Add(confirmacion);
    }

    public void AgregarCuota(PagoMensual cuota)
    {
        _context.PagosMensuales.Add(cuota);
    }

    public void EliminarCuota(PagoMensual cuota)
    {
        _context.PagosMensuales.Remove(cuota);
    }

    public async Task GuardarCambiosAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
