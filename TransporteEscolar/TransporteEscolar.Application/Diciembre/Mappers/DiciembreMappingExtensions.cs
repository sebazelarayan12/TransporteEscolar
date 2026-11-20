using TransporteEscolar.Application.Diciembre.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.Diciembre.Mappers;

public static class DiciembreMappingExtensions
{
    public static DiciembreModel.TitularItem ToItem(this DiciembreTitularDatos datos)
    {
        var estado = datos.Va switch
        {
            null => DiciembreEstados.Pendiente,
            true => DiciembreEstados.Va,
            false => DiciembreEstados.NoVa
        };

        // Cuota sin decisión: la creó alguien a mano antes de que existiera la pestaña.
        var cuotaPreexistente = datos.Cuota is not null && datos.Va is null;

        return new DiciembreModel.TitularItem(
            datos.TitularId,
            datos.Apellido,
            datos.NombreContacto,
            datos.Pasajeros.ToList(),
            estado,
            datos.MontoPactado,
            datos.Cuota?.Monto,
            datos.Cuota?.PagoMensualId,
            datos.Cuota?.TotalPagado ?? 0m,
            cuotaPreexistente);
    }
}
