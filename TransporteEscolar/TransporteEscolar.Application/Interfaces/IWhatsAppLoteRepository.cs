using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Abstrae el acceso a datos de LoteWhatsApp y MensajeWhatsApp.
/// Las implementaciones viven en Infrastructure y conocen el AppDbContext.
/// </summary>
public interface IWhatsAppLoteRepository
{
    // ── Lote ──────────────────────────────────────────────────────────────

    Task<LoteWhatsApp> CrearLoteAsync(LoteWhatsApp lote, CancellationToken ct = default);
    Task<LoteWhatsApp?> ObtenerLotePorIdAsync(int loteId, CancellationToken ct = default);
    Task ActualizarLoteAsync(LoteWhatsApp lote, CancellationToken ct = default);

    // ── Mensaje ────────────────────────────────────────────────────────────

    Task AgregarMensajesAsync(IEnumerable<MensajeWhatsApp> mensajes, CancellationToken ct = default);
    Task<List<MensajeWhatsApp>> ObtenerMensajesPendientesPorLoteAsync(int loteId, CancellationToken ct = default);
    Task ActualizarMensajeAsync(MensajeWhatsApp mensaje, CancellationToken ct = default);
    Task<MensajeWhatsApp?> ObtenerMensajePorProviderIdAsync(string providerMessageId, CancellationToken ct = default);

    // ── Estadísticas del lote ─────────────────────────────────────────────

    Task<WhatsAppEstadisticasLote> ObtenerEstadisticasLoteAsync(int loteId, CancellationToken ct = default);

    // ── Titulares para el lote ────────────────────────────────────────────

    Task<List<TitularParaWhatsApp>> ObtenerTitularesActivosConTelefonoAsync(
        List<int>? filtroIds,
        CancellationToken ct = default);
}

/// <summary>Proyección de estadísticas de un lote.</summary>
public record WhatsAppEstadisticasLote(
    int Total,
    int Enviados,
    int Entregados,
    int Leidos,
    int Errores,
    int Pendientes);

/// <summary>Proyección mínima de un Titular con su teléfono principal.</summary>
public record TitularParaWhatsApp(
    int TitularId,
    string NombreContacto,
    string Apellido,
    decimal MontoMensualPactado,
    string TelefonoPrincipal);
