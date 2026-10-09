using MediatR;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Bot.Commands;

/// <summary>
/// Registra un pago que cargó el bot, repartido entre las cuotas pendientes. Es idempotente por id de mensaje
/// y guarda todos los movimientos en un único SaveChanges.
/// </summary>
public sealed record RegistrarPagoBotCommand(BotPagoModel.RegistrarRequest Payload) : IRequest<BotPagoModel.RegistrarResultado>;

public sealed class RegistrarPagoBotCommandHandler : IRequestHandler<RegistrarPagoBotCommand, BotPagoModel.RegistrarResultado>
{
    private const string ZonaArgentina = "America/Buenos_Aires";

    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly INotificacionService _notificacionService;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<RegistrarPagoBotCommandHandler> _logger;

    public RegistrarPagoBotCommandHandler(
        ITitularRepository titularRepository,
        IPagoMensualRepository pagoMensualRepository,
        INotificacionService notificacionService,
        TimeProvider timeProvider,
        ILogger<RegistrarPagoBotCommandHandler> logger)
    {
        _titularRepository = titularRepository;
        _pagoMensualRepository = pagoMensualRepository;
        _notificacionService = notificacionService;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task<BotPagoModel.RegistrarResultado> Handle(RegistrarPagoBotCommand request, CancellationToken cancellationToken)
    {
        var ahora = _timeProvider.GetUtcNow();
        var zona = TimeZoneInfo.FindSystemTimeZoneById(ZonaArgentina);
        var hoyArgentina = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(ahora, zona).DateTime);

        var datos = BotPagoValidator.ValidarRegistro(request.Payload, hoyArgentina);
        var origen = BotMensajeId.Hashear(datos.MensajeId);

        // Idempotencia: si ya hay movimientos de ese mensaje se devuelven sin crear nada.
        var existentes = await _pagoMensualRepository.GetMovimientosPorOrigenMensajeIdAsync(origen, cancellationToken);
        if (existentes.Count > 0)
            return new BotPagoModel.RegistrarResultado(ConstruirRespuesta(existentes), false);

        var titular = await _titularRepository.GetByIdAsync(datos.TitularId, cancellationToken);
        if (titular is null || titular.FechaBaja is not null)
            throw new NotFoundException(nameof(Titular), datos.TitularId);

        var pagos = await _pagoMensualRepository.GetByTitularIdAsync(datos.TitularId, cancellationToken);

        // Hoy: el instante actual. Otro día: ese día a las 12:00 hora argentina (UTC-3, sin horario de verano).
        var fechaPago = datos.Fecha == hoyArgentina
            ? ahora
            : new DateTimeOffset(datos.Fecha.Year, datos.Fecha.Month, datos.Fecha.Day, 12, 0, 0, TimeSpan.FromHours(-3));

        IReadOnlyList<(PagoMensual Pago, PagoMovimiento Movimiento)> aplicados;
        try
        {
            aplicados = titular.RegistrarPagoDetallado(datos.Monto, fechaPago, datos.MedioPago, null, pagos);
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        var grupoId = Guid.NewGuid();
        foreach (var (_, movimiento) in aplicados)
            movimiento.MarcarComoCargadoPorBot(origen, grupoId, ahora.UtcDateTime);

        // UN solo SaveChanges: o se guardan todos los movimientos o ninguno.
        var guardado = await _pagoMensualRepository.GuardarPagoDeBotAsync(cancellationToken);
        if (!guardado)
        {
            // Carrera: otro pedido con el mismo mensaje guardó primero.
            var yaGuardados = await _pagoMensualRepository.GetMovimientosPorOrigenMensajeIdAsync(origen, cancellationToken);
            if (yaGuardados.Count == 0)
                throw new InvalidOperationException("No se pudo registrar el pago.");
            return new BotPagoModel.RegistrarResultado(ConstruirRespuesta(yaGuardados), false);
        }

        // El pago ya está guardado: un fallo de la notificación NO debe hacerlo fallar.
        try
        {
            var periodos = aplicados.Select(a => $"{a.Pago.Mes:D2}/{a.Pago.Anio}").ToList();
            await _notificacionService.CrearNotificacionPagoBotAsync(titular.Apellido, datos.Monto, periodos, aplicados[0].Pago.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo crear la notificación del pago del bot (el pago ya quedó guardado)");
        }

        var movimientos = aplicados
            .Select(a => new BotPagoModel.MovimientoItem(a.Movimiento.Id, a.Pago.Anio, a.Pago.Mes, a.Movimiento.Monto, a.Pago.SaldoPendiente()))
            .ToList();

        return new BotPagoModel.RegistrarResultado(new BotPagoModel.PagoResponse(grupoId, titular.Id, datos.Monto, movimientos), true);
    }

    // Arma la respuesta desde movimientos ya guardados (reintento): saldoRestante es el saldo ACTUAL de cada cuota.
    private static BotPagoModel.PagoResponse ConstruirRespuesta(IReadOnlyList<PagoMovimiento> movimientos)
    {
        var ordenados = movimientos.OrderBy(m => m.PagoMensual.Anio).ThenBy(m => m.PagoMensual.Mes).ToList();
        var primero = ordenados[0];
        return new BotPagoModel.PagoResponse(
            primero.GrupoId ?? Guid.Empty,
            primero.PagoMensual.TitularId,
            ordenados.Sum(m => m.Monto),
            ordenados.Select(m => new BotPagoModel.MovimientoItem(m.Id, m.PagoMensual.Anio, m.PagoMensual.Mes, m.Monto, m.PagoMensual.SaldoPendiente())).ToList());
    }
}
