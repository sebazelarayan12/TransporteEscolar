using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _context;

    public DashboardRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardModel.Summary> ObtenerResumenAsync(CancellationToken cancellationToken = default)
    {
        var hoy = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var mesActual = hoy.Month;
        var anioActual = hoy.Year;

        var pendientesQuery = _context.PagosMensuales
            .AsNoTracking()
            .Where(p =>
                p.Mes == mesActual &&
                p.Anio == anioActual &&
                p.FechaVencimiento >= hoy)
            .Select(p => p.MontoGenerado - (p.Movimientos.Sum(m => (decimal?)m.Monto) ?? 0m))
            .Where(saldo => saldo > 0);

        var vencidosQuery = _context.PagosMensuales
            .AsNoTracking()
            .Where(p => p.FechaVencimiento < hoy)
            .Select(p => p.MontoGenerado - (p.Movimientos.Sum(m => (decimal?)m.Monto) ?? 0m))
            .Where(saldo => saldo > 0);

        var pendientesSaldos = await pendientesQuery.ToListAsync(cancellationToken);
        var totalPendiente = pendientesSaldos.Sum();
        var cantidadPendiente = pendientesSaldos.Count;

        var vencidosSaldos = await vencidosQuery.ToListAsync(cancellationToken);
        var totalVencido = vencidosSaldos.Sum();
        var cantidadVencido = vencidosSaldos.Count;

        var titularesActivos = await _context.Titulares
            .AsNoTracking()
            .CountAsync(t => t.FechaBaja == null, cancellationToken);

        var pasajerosActivos = await _context.Pasajeros
            .AsNoTracking()
            .CountAsync(p => p.FechaBaja == null, cancellationToken);

        return new DashboardModel.Summary(
            totalPendiente,
            cantidadPendiente,
            totalVencido,
            cantidadVencido,
            titularesActivos,
            pasajerosActivos);
    }

    public async Task<List<DashboardModel.RevenuePoint>> ObtenerRecaudacionHistoricoAsync(
        DateTime fechaInicio,
        CancellationToken cancellationToken = default)
    {
        var inicio = new DateTime(fechaInicio.Year, fechaInicio.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var inicioYear = inicio.Year;
        var inicioMes = inicio.Month;

        var pagos = await _context.PagosMensuales
            .AsNoTracking()
            .Where(p => p.Anio > inicioYear || (p.Anio == inicioYear && p.Mes >= inicioMes))
            .Select(p => new
            {
                p.Anio,
                p.Mes,
                p.MontoGenerado,
                TotalPagado = p.Movimientos.Sum(m => (decimal?)m.Monto) ?? 0m
            })
            .ToListAsync(cancellationToken);

        var datos = pagos
            .GroupBy(x => new { x.Anio, x.Mes })
            .Select(g => new
            {
                g.Key.Anio,
                g.Key.Mes,
                TotalGenerado = g.Sum(x => x.MontoGenerado),
                TotalPagado = g.Sum(x => x.TotalPagado)
            })
            .OrderBy(x => x.Anio)
            .ThenBy(x => x.Mes)
            .ToList();

        return datos
            .Select(x => new DashboardModel.RevenuePoint(
                x.Anio,
                x.Mes,
                x.TotalGenerado,
                x.TotalPagado,
                Math.Max(x.TotalGenerado - x.TotalPagado, 0m)))
            .ToList();
    }

    public async Task<List<DashboardModel.ActivityItem>> ObtenerActividadRecienteAsync(
        int limite,
        CancellationToken cancellationToken = default)
    {
        var cantidad = Math.Max(limite, 1);

        var movimientos = await _context.PagosMovimientos
            .AsNoTracking()
            .OrderByDescending(m => m.FechaPago)
            .Take(cantidad)
            .Select(m => new
            {
                m.Id,
                m.Monto,
                m.FechaPago,
                m.MedioPago,
                TitularId = m.PagoMensual.TitularId,
                TitularNombre = m.PagoMensual.Titular.NombreContacto,
                TitularApellido = m.PagoMensual.Titular.Apellido,
                m.PagoMensual.Mes,
                m.PagoMensual.Anio,
                MontoGenerado = m.PagoMensual.MontoGenerado,
                TotalPagado = m.PagoMensual.Movimientos.Sum(x => (decimal?)x.Monto) ?? 0m
            })
            .ToListAsync(cancellationToken);

        return movimientos
            .Select(m => new DashboardModel.ActivityItem(
                m.Id,
                m.TitularId,
                m.TitularNombre,
                m.TitularApellido,
                $"{m.Mes:D2}/{m.Anio}",
                m.Monto,
                m.FechaPago,
                m.MedioPago,
                Math.Max(m.MontoGenerado - m.TotalPagado, 0m)))
            .ToList();
    }
}
