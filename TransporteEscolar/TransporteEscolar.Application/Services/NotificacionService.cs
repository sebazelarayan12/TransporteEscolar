using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

    public class NotificacionService : INotificacionService
    {
        private readonly INotificacionRepository _repository;
        private readonly IWebPushService _webPushService;
        private readonly ILogger<NotificacionService> _logger;

        public NotificacionService(
            INotificacionRepository repository,
            IWebPushService webPushService,
            ILogger<NotificacionService> logger)
        {
            _repository = repository;
            _webPushService = webPushService;
            _logger = logger;
        }

        /// <summary>
        /// Persiste la última actualización del producto. Siempre se mantiene un único registro publicado.
        /// </summary>
        public async Task<NotificacionModel.Response> GuardarActualizacionProductoAsync(
            NotificacionModel.ActualizacionRequest request,
            CancellationToken cancellationToken = default)
        {
            var titulo = request.Titulo.Trim();
            var descripcion = request.Descripcion.Trim();
            var linkNormalizado = string.IsNullOrWhiteSpace(request.Link) ? null : request.Link.Trim();
            var fechaPublicacion = NormalizarFechaPublicacion(request.FechaPublicacion);

            var actualizacionExistente = await _repository.GetActualizacionProductoAsync(cancellationToken);

            if (actualizacionExistente is null)
            {
                actualizacionExistente = Notificacion.CrearActualizacionProducto(titulo, descripcion, fechaPublicacion, linkNormalizado);
                await _repository.AddAsync(actualizacionExistente, cancellationToken);
            }
            else
            {
                actualizacionExistente.ActualizarActualizacionProducto(titulo, descripcion, fechaPublicacion, linkNormalizado);
                await _repository.UpdateAsync(actualizacionExistente, cancellationToken);
            }

            await EnviarPushAsync(titulo, descripcion, linkNormalizado, cancellationToken);

            return MapearAResponse(actualizacionExistente);
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
        var nombreCorto = FormatearNombreCompacto(titularNombre);
        var notificacion = new Notificacion(
            "PAGO_REGISTRADO",
            "Nuevo pago registrado",
            $"{nombreCorto} pagó ${monto:N0} ({periodo})",
            "PagoMensual",
            pagoMensualId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
        
        // Limpieza oportunista de notificaciones antiguas
        await LimpiarNotificacionesAntiguasAsync(cancellationToken);

        await EnviarPushAsync(
            "Nuevo pago registrado",
            $"{nombreCorto} pagó ${monto:N0} ({periodo})",
            $"/pagos?pagoId={pagoMensualId}",
            cancellationToken);
    }

    public async Task CrearNotificacionAjusteMontoAsync(
        string titularNombre, 
        decimal nuevoMonto, 
        int titularId, 
        CancellationToken cancellationToken = default)
    {
        var nombreCorto = FormatearNombreCompacto(titularNombre);
        var notificacion = new Notificacion(
            "AJUSTE_MONTO",
            "Ajuste de monto",
            $"Monto de {nombreCorto}: ${nuevoMonto:N0}",
            "Titular",
            titularId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
        
        // Limpieza oportunista de notificaciones antiguas
        await LimpiarNotificacionesAntiguasAsync(cancellationToken);

        await EnviarPushAsync(
            "Ajuste de monto",
            $"Monto de {nombreCorto}: ${nuevoMonto:N0}",
            $"/titulares/{titularId}",
            cancellationToken);
    }

    public async Task CrearNotificacionReinscripcionAsync(
        string titularNombre, 
        int cantidadPasajeros, 
        int titularId, 
        CancellationToken cancellationToken = default)
    {
        var nombreCorto = FormatearNombreCompacto(titularNombre);
        var mensaje = cantidadPasajeros == 1 
            ? $"{nombreCorto}: 1 pasajero reinscripto"
            : $"{nombreCorto}: {cantidadPasajeros} pasajeros reinscriptos";
        
        var notificacion = new Notificacion(
            "REINSCRIPCION",
            "Reinscripción confirmada",
            mensaje,
            "Titular",
            titularId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
        
        // Limpieza oportunista de notificaciones antiguas
        await LimpiarNotificacionesAntiguasAsync(cancellationToken);

        await EnviarPushAsync(
            "Reinscripción confirmada",
            mensaje,
            $"/titulares/{titularId}",
            cancellationToken);
    }

    public async Task CrearNotificacionTitularCreadoAsync(
        string titularNombre, 
        int titularId, 
        CancellationToken cancellationToken = default)
    {
        var notificacion = new Notificacion(
            "TITULAR_CREADO",
            "Nuevo titular",
            $"Titular: {titularNombre}",
            "Titular",
            titularId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
        
        // Limpieza oportunista de notificaciones antiguas
        await LimpiarNotificacionesAntiguasAsync(cancellationToken);

        await EnviarPushAsync(
            "Nuevo titular",
            $"Titular: {titularNombre}",
            $"/titulares/{titularId}",
            cancellationToken);
    }

    public async Task CrearNotificacionPasajeroCreadoAsync(
        string pasajeroNombre, 
        string titularNombre, 
        int pasajeroId, 
        CancellationToken cancellationToken = default)
    {
        var nombreCortoTitular = FormatearNombreCompacto(titularNombre);
        var notificacion = new Notificacion(
            "PASAJERO_CREADO",
            "Nuevo pasajero",
            $"{pasajeroNombre} (titular: {nombreCortoTitular})",
            "Pasajero",
            pasajeroId);
        
        await _repository.AddAsync(notificacion, cancellationToken);
        
        // Limpieza oportunista de notificaciones antiguas
        await LimpiarNotificacionesAntiguasAsync(cancellationToken);

        await EnviarPushAsync(
            "Nuevo pasajero",
            $"{pasajeroNombre} (titular: {nombreCortoTitular})",
            $"/pasajeros/{pasajeroId}",
            cancellationToken);
    }

    private async Task EnviarPushAsync(string titulo, string mensaje, string? url, CancellationToken cancellationToken)
    {
        try
        {
            await _webPushService.EnviarATodosAsync(titulo, mensaje, url, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al enviar notificacion push {Titulo}", titulo);
        }
    }

    public async Task<int> LimpiarNotificacionesAntiguasAsync(CancellationToken cancellationToken = default)
    {
        return await _repository.LimpiarAntiguasAsync(cancellationToken);
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
            n.EntidadId,
            n.EsActualizacionProducto,
            n.FechaPublicacion,
            n.Link);
    }

    /// <summary>
    /// Convierte un nombre completo a formato compacto: "Cecilia BERTIKIAN" → "C. BERTIKIAN"
    /// </summary>
    private static string FormatearNombreCompacto(string nombreCompleto)
    {
        if (string.IsNullOrWhiteSpace(nombreCompleto))
            return nombreCompleto;
        
        var partes = nombreCompleto.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (partes.Length == 0)
            return nombreCompleto;
        
        if (partes.Length == 1)
            return partes[0]; // Solo hay un nombre/apellido
        
        // Primera letra del nombre + resto de palabras (apellidos)
        var inicial = partes[0][0].ToString().ToUpperInvariant();
        var apellidos = string.Join(" ", partes.Skip(1));
        
        return $"{inicial}. {apellidos}";
    }

    private static DateTime NormalizarFechaPublicacion(DateTime fechaPublicacion)
    {
        return fechaPublicacion.Kind switch
        {
            DateTimeKind.Utc => fechaPublicacion,
            DateTimeKind.Local => fechaPublicacion.ToUniversalTime(),
            _ => DateTime.SpecifyKind(fechaPublicacion, DateTimeKind.Utc)
        };
    }
}
