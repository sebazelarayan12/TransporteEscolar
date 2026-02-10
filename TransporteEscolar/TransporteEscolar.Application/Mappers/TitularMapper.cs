using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Mappers;

public static class TitularMapper
{
    public static TitularModel.Response MapearAResponse(Titular titular) =>
        new(
            titular.Id,
            titular.Apellido,
            titular.NombreContacto,
            titular.Direccion,
            titular.MontoMensualPactado,
            titular.FechaAlta,
            titular.FechaBaja,
            titular.FechaBaja == null);
}
