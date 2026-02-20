using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class NotificacionService : INotificacionService
{
    private readonly INotificacionRepository _repository;

    public NotificacionService(INotificacionRepository repository)
    {
        _repository = repository;
    }

    public async Task<PaginationModel.ResponsePagination<NotificacionModel.Response>> ObtenerPaginadasAsync(
        NotificacionModel.FilterRequest request, 
        CancellationToken cancellationToken = default)
    {
        var notificaciones = await _repository.GetPaginadasAsync(
            request.PageNumber, 
            request.PageSize, 
            request.SoloNoLeidas, 
            cancellationToken);
        
        var countNoLeidas = await _repository.GetCountNoLeidasAsync(cancellationToken);
        
        var data = notificaciones.Select(MapearAResponse).ToList();
        
        return new PaginationModel.ResponsePagination<NotificacionModel.Response>(data, countNoLeidas);
    }

    public async Task<NotificacionModel.CountResponse> ObtenerCountNoLeidasAsync(CancellationToken cancellationToken = default)
    {
        var count = await _repository.GetCountNoLeidasAsync(cancellationToken);
        return new NotificacionModel.CountResponse(count);
    }

    public async Task MarcarComoLeidaAsync(int id, CancellationToken cancellationToken = default)
    {
        var notificacion = await _repository.GetByIdAsync(id, cancellationToken);
        if (notificacion == null)
            throw new KeyNotFoundException($"Notificación {id} no encontrada");

        notificacion.MarcarComoLeida();
        await _repository.UpdateAsync(notificacion, cancellationToken);
    }

    public async Task MarcarTodasComoLeidasAsync(CancellationToken cancellationToken = default)
    {
        await _repository.MarcarTodasComoLeidasAsync(cancellationToken);
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        await _repository.DeleteAsync(id, cancellationToken);
    }

    // Métodos de creación de notificaciones
    public async Task CrearNotificacionPagoRegistradoAsync(
        string titularNombre, 
        decimal monto, 
        string periodo, 
        int pagoMensualId, 
        CancellationToken cancellationToken = default)
    {
        var notificacion = new Notificacion(
            "PAGO_REGISTRADO",
            "Nuevo pago registrado",
            $"{titularNombre} pagó ${monto:N0} para {periodo}",
            "PagoMensual",
            pagoMensualId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
    }

    public async Task CrearNotificacionAjusteMontoAsync(
        string titularNombre, 
        decimal nuevoMonto, 
        int titularId, 
        CancellationToken cancellationToken = default)
    {
        var notificacion = new Notificacion(
            "AJUSTE_MONTO",
            "Ajuste de monto",
            $"Se ajustó el monto de {titularNombre} a ${nuevoMonto:N0}",
            "Titular",
            titularId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
    }

    public async Task CrearNotificacionReinscripcionAsync(
        string titularNombre, 
        int cantidadPasajeros, 
        int titularId, 
        CancellationToken cancellationToken = default)
    {
        var mensaje = cantidadPasajeros == 1 
            ? $"1 pasajero reinscripto para {titularNombre}"
            : $"{cantidadPasajeros} pasajeros reinscriptos para {titularNombre}";
        
        var notificacion = new Notificacion(
            "REINSCRIPCION",
            "Reinscripción confirmada",
            mensaje,
            "Titular",
            titularId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
    }

    public async Task CrearNotificacionTitularCreadoAsync(
        string titularNombre, 
        int titularId, 
        CancellationToken cancellationToken = default)
    {
        var notificacion = new Notificacion(
            "TITULAR_CREADO",
            "Nuevo titular",
            $"Nuevo titular: {titularNombre}",
            "Titular",
            titularId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
    }

    public async Task CrearNotificacionPasajeroCreadoAsync(
        string pasajeroNombre, 
        string titularNombre, 
        int pasajeroId, 
        CancellationToken cancellationToken = default)
    {
        var notificacion = new Notificacion(
            "PASAJERO_CREADO",
            "Nuevo pasajero",
            $"Nuevo pasajero: {pasajeroNombre} (titular: {titularNombre})",
            "Pasajero",
            pasajeroId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
    }

    private static NotificacionModel.Response MapearAResponse(Notificacion n)
    {
        return new NotificacionModel.Response(
            n.Id,
            n.Tipo,
            n.Titulo,
            n.Mensaje,
            n.FechaCreacion,
            n.Leida,
            n.FechaLectura,
            n.EntidadTipo,
            n.EntidadId);
    }
}
