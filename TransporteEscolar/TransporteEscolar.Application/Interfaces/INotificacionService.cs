using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface INotificacionService
{
    Task<PaginationModel.ResponsePagination<NotificacionModel.Response>> ObtenerPaginadasAsync(NotificacionModel.FilterRequest request, CancellationToken cancellationToken = default);
    Task<NotificacionModel.CountResponse> ObtenerCountNoLeidasAsync(CancellationToken cancellationToken = default);
    Task MarcarComoLeidaAsync(int id, CancellationToken cancellationToken = default);
    Task MarcarTodasComoLeidasAsync(CancellationToken cancellationToken = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
    
    // Métodos para crear notificaciones desde otros servicios
    Task CrearNotificacionPagoRegistradoAsync(string titularNombre, decimal monto, string periodo, int pagoMensualId, CancellationToken cancellationToken = default);
    Task CrearNotificacionAjusteMontoAsync(string titularNombre, decimal nuevoMonto, int titularId, CancellationToken cancellationToken = default);
    Task CrearNotificacionReinscripcionAsync(string titularNombre, int cantidadPasajeros, int titularId, CancellationToken cancellationToken = default);
    Task CrearNotificacionTitularCreadoAsync(string titularNombre, int titularId, CancellationToken cancellationToken = default);
    Task CrearNotificacionPasajeroCreadoAsync(string pasajeroNombre, string titularNombre, int pasajeroId, CancellationToken cancellationToken = default);
}
