using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class PagoMovimientoMappingExtensions
{
    public static PagoMensualModel.MovimientoResponse ToPagoMensualMovimientoResponse(this PagoMovimiento movimiento)
        => new(
            movimiento.Id,
            movimiento.Monto,
            movimiento.FechaPago,
            movimiento.MedioPago,
            movimiento.Observaciones);

    public static PagoMovimientoModel.Response ToPagoMovimientoResponse(
        this PagoMovimiento movimiento,
        PagoMensual? pagoMensual = null)
    {
        var pago = pagoMensual ?? movimiento.PagoMensual;
        var titular = pago?.Titular;

        var titularApellido = titular?.Apellido ?? string.Empty;
        var titularNombre = titular?.NombreContacto ?? string.Empty;
        var titularNombreCompleto = string.Join(" ", new[] { titularNombre, titularApellido }
            .Where(value => !string.IsNullOrWhiteSpace(value))).Trim();

        return new PagoMovimientoModel.Response(
            movimiento.Id,
            movimiento.PagoMensualId,
            titular?.Id ?? pago?.TitularId ?? 0,
            titularApellido,
            titularNombre,
            titularNombreCompleto,
            pago?.Mes ?? 0,
            pago?.Anio ?? 0,
            pago is null ? string.Empty : PagoMensualMappingExtensions.BuildPeriodo(pago.Mes, pago.Anio),
            movimiento.FechaPago,
            movimiento.Monto,
            movimiento.MedioPago,
            movimiento.Observaciones);
    }
}
