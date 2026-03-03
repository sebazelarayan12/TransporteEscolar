using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class NotificacionRepository : INotificacionRepository
{
    private readonly AppDbContext _context;

    public NotificacionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Notificacion?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Notificaciones
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<Notificacion?> GetActualizacionProductoAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Notificaciones
            .FirstOrDefaultAsync(n => n.EsActualizacionProducto, cancellationToken);
    }

    public async Task<List<Notificacion>> GetPaginadasAsync(
        int pageNumber, 
        int pageSize, 
        bool soloNoLeidas, 
        CancellationToken cancellationToken = default)
    {
        var query = _context.Notificaciones.AsQueryable();

        if (soloNoLeidas)
            query = query.Where(n => !n.Leida);

        return await query
            .OrderByDescending(n => n.FechaCreacion)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountNoLeidasAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Notificaciones
            .CountAsync(n => !n.Leida, cancellationToken);
    }

    public async Task<Notificacion> AddAsync(Notificacion notificacion, CancellationToken cancellationToken = default)
    {
        _context.Notificaciones.Add(notificacion);
        await _context.SaveChangesAsync(cancellationToken);
        return notificacion;
    }

    public async Task UpdateAsync(Notificacion notificacion, CancellationToken cancellationToken = default)
    {
        _context.Notificaciones.Update(notificacion);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarcarTodasComoLeidasAsync(CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.UtcNow;
        await _context.Notificaciones
            .Where(n => !n.Leida)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(n => n.Leida, true)
                .SetProperty(n => n.FechaLectura, ahora),
                cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        await _context.Notificaciones
            .Where(n => n.Id == id)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<int> LimpiarAntiguasAsync(CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.UtcNow;
        var limiteLeidas = ahora.AddDays(-7);      // 7 días para leídas
        var limiteNoLeidas = ahora.AddDays(-30);   // 30 días para no leídas

        // Eliminar leídas con más de 7 días desde lectura
        // La actualización de producto se mantiene siempre: solo se purgan otras notificaciones.
        var eliminadasLeidas = await _context.Notificaciones
            .Where(n => !n.EsActualizacionProducto)
            .Where(n => n.Leida && n.FechaLectura != null && n.FechaLectura < limiteLeidas)
            .ExecuteDeleteAsync(cancellationToken);

        // Eliminar no leídas con más de 30 días desde creación
        var eliminadasNoLeidas = await _context.Notificaciones
            .Where(n => !n.EsActualizacionProducto)
            .Where(n => !n.Leida && n.FechaCreacion < limiteNoLeidas)
            .ExecuteDeleteAsync(cancellationToken);

        return eliminadasLeidas + eliminadasNoLeidas;
    }
}
