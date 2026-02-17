using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IPagoMensualRepository
{
    Task<PagoMensual?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<PagoMensual>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<PagoMensual>> GetByTitularIdAsync(int titularId, CancellationToken cancellationToken = default);
    Task<List<PagoMensual>> GetVencidosAsync(CancellationToken cancellationToken = default);
    Task<List<PagoMensual>> GetPendientesAsync(CancellationToken cancellationToken = default);
    Task<PagoMensual?> GetByTitularMesAnioAsync(int titularId, int mes, int anio, CancellationToken cancellationToken = default);
    Task<List<PagoMensual>> GetByMesAnioAsync(int mes, int anio, CancellationToken cancellationToken = default);
    Task<(List<PagoMovimiento> Movimientos, int TotalCount)> ObtenerMovimientosAsync(
        DateTimeOffset fechaDesde,
        DateTimeOffset fechaHasta,
        int? titularId,
        string? medioPago,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<PagoMovimiento?> GetMovimientoByIdAsync(int movimientoId, CancellationToken cancellationToken = default);
    Task<(List<Titular> Titulares, int TotalCount)> GetTitularesConPagosAsync(string? search, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<PagoMensual> AddAsync(PagoMensual pagoMensual, CancellationToken cancellationToken = default);
    Task UpdateAsync(PagoMensual pagoMensual, CancellationToken cancellationToken = default);
    Task<bool> ExisteAsync(int id, CancellationToken cancellationToken = default);
}
