using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mapping;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Application.Bot.Commands;

/// <summary>
/// Anota un gasto variable que cargó el bot. Es idempotente por id de mensaje: si ya existe, devuelve el existente.
/// </summary>
public sealed record RegistrarGastoBotCommand(BotGastoModel.RegistrarRequest Payload)
    : IRequest<BotGastoModel.RegistrarResultado>;

public sealed class RegistrarGastoBotCommandHandler
    : IRequestHandler<RegistrarGastoBotCommand, BotGastoModel.RegistrarResultado>
{
    private const string ZonaArgentina = "America/Buenos_Aires";

    private readonly IGastoRepository _gastoRepository;
    private readonly TimeProvider _timeProvider;

    public RegistrarGastoBotCommandHandler(IGastoRepository gastoRepository, TimeProvider timeProvider)
    {
        _gastoRepository = gastoRepository;
        _timeProvider = timeProvider;
    }

    public async Task<BotGastoModel.RegistrarResultado> Handle(
        RegistrarGastoBotCommand request,
        CancellationToken cancellationToken)
    {
        var ahora = _timeProvider.GetUtcNow();
        var zona = TimeZoneInfo.FindSystemTimeZoneById(ZonaArgentina);
        var hoyArgentina = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(ahora, zona).DateTime);

        var datos = BotGastoValidator.Validar(request.Payload, hoyArgentina);

        var existente = await _gastoRepository.ObtenerGastoMensualPorOrigenMensajeIdAsync(datos.MensajeId, cancellationToken);
        if (existente is not null)
            return new BotGastoModel.RegistrarResultado(GastoMapper.ToResponse(existente), false);

        var fecha = DateTime.SpecifyKind(datos.Fecha.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var gasto = new GastoMensual(
            datos.Fecha.Month,
            datos.Fecha.Year,
            GastoMensual.TipoVariable,
            datos.Categoria,
            datos.Descripcion,
            datos.Monto,
            fecha,
            datos.MedioPago,
            Enum.Parse<EstadoPagoGasto>(datos.EstadoPago),
            observaciones: null,
            vehiculo: datos.Vehiculo);

        gasto.MarcarComoCargadoPorBot(datos.MensajeId, ahora.UtcDateTime);

        var (guardado, creado) = await _gastoRepository.AgregarGastoDeBotAsync(gasto, cancellationToken);
        return new BotGastoModel.RegistrarResultado(GastoMapper.ToResponse(guardado), creado);
    }
}
