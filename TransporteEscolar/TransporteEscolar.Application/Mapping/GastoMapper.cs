using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mapping;

/// <summary>Mapeo compartido de <see cref="GastoMensual"/> a su respuesta.</summary>
public static class GastoMapper
{
    public static GastoModel.GastoMensualResponse ToResponse(GastoMensual gasto)
    {
        return new GastoModel.GastoMensualResponse(
            gasto.Id,
            gasto.Mes,
            gasto.Anio,
            gasto.Tipo,
            gasto.Categoria,
            gasto.Descripcion,
            gasto.Monto,
            gasto.Fecha,
            gasto.MedioPago,
            gasto.EstadoPago.ToString(),
            gasto.Observaciones,
            gasto.Vehiculo,
            gasto.GastoFijoTemplateId,
            gasto.NumeroCuota,
            gasto.TotalCuotas,
            gasto.FechaActualizacion);
    }
}
