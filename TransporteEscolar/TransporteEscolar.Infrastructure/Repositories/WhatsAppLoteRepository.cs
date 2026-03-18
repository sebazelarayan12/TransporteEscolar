using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class WhatsAppLoteRepository : IWhatsAppLoteRepository
{
    private readonly AppDbContext _context;

    public WhatsAppLoteRepository(AppDbContext context)
    {
        _context = context;
    }

    // ── Lote ──────────────────────────────────────────────────────────────

    public async Task<LoteWhatsApp> CrearLoteAsync(LoteWhatsApp lote, CancellationToken ct = default)
    {
        _context.LotesWhatsApp.Add(lote);
        await _context.SaveChangesAsync(ct);
        return lote;
    }

    public async Task<LoteWhatsApp?> ObtenerLotePorIdAsync(int loteId, CancellationToken ct = default)
        => await _context.LotesWhatsApp.FindAsync([loteId], ct);

    public async Task ActualizarLoteAsync(LoteWhatsApp lote, CancellationToken ct = default)
    {
        _context.LotesWhatsApp.Update(lote);
        await _context.SaveChangesAsync(ct);
    }

    // ── Mensaje ────────────────────────────────────────────────────────────

    public async Task AgregarMensajesAsync(IEnumerable<MensajeWhatsApp> mensajes, CancellationToken ct = default)
    {
        _context.MensajesWhatsApp.AddRange(mensajes);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<List<MensajeWhatsApp>> ObtenerMensajesPendientesPorLoteAsync(int loteId, CancellationToken ct = default)
        => await _context.MensajesWhatsApp
            .Where(m => m.LoteId == loteId && m.Estado == EstadoMensaje.Pendiente)
            .ToListAsync(ct);

    public async Task ActualizarMensajeAsync(MensajeWhatsApp mensaje, CancellationToken ct = default)
    {
        _context.MensajesWhatsApp.Update(mensaje);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<MensajeWhatsApp?> ObtenerMensajePorProviderIdAsync(string providerMessageId, CancellationToken ct = default)
        => await _context.MensajesWhatsApp
            .FirstOrDefaultAsync(m => m.ProviderMessageId == providerMessageId, ct);

    // ── Estadísticas ───────────────────────────────────────────────────────

    public async Task<WhatsAppEstadisticasLote> ObtenerEstadisticasLoteAsync(int loteId, CancellationToken ct = default)
    {
        var stats = await _context.MensajesWhatsApp
            .Where(m => m.LoteId == loteId)
            .GroupBy(_ => 1)
            .Select(g => new WhatsAppEstadisticasLote(
                g.Count(),
                g.Count(m => m.Estado == EstadoMensaje.Enviado),
                g.Count(m => m.Estado == EstadoMensaje.Entregado),
                g.Count(m => m.Estado == EstadoMensaje.Leido),
                g.Count(m => m.Estado == EstadoMensaje.Error),
                g.Count(m => m.Estado == EstadoMensaje.Pendiente)))
            .FirstOrDefaultAsync(ct);

        return stats ?? new WhatsAppEstadisticasLote(0, 0, 0, 0, 0, 0);
    }

    // ── Titulares ─────────────────────────────────────────────────────────

    public async Task<List<TitularParaWhatsApp>> ObtenerTitularesActivosConTelefonoAsync(
        List<int>? filtroIds,
        CancellationToken ct = default)
    {
        var query = _context.Titulares
            .Where(t => t.FechaBaja == null)
            .Where(t => t.Telefonos.Any(tel => tel.EsPrincipal && tel.FechaBaja == null));

        if (filtroIds is { Count: > 0 })
            query = query.Where(t => filtroIds.Contains(t.Id));

        return await query.Select(t => new TitularParaWhatsApp(
            t.Id,
            t.NombreContacto,
            t.Apellido,
            t.MontoMensualPactado,
            t.Telefonos.First(tel => tel.EsPrincipal && tel.FechaBaja == null).NumeroE164
        )).ToListAsync(ct);
    }
}
