using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Reparte los kilómetros de cada viaje entre las familias que lo componen usando el
/// valor de Shapley, y administra la casa fija (parada fija) que cada viaje necesita
/// para calcularse.
/// </summary>
public interface IRecorridoRepartoService
{
    /// <summary>
    /// Recalcula el reparto de todos los pares (horario, vehículo) que tienen su parada fija
    /// marcada. Hace una sola consulta al motor de ruteo por viaje calculable (la matriz de
    /// distancias); el reparto se calcula después en memoria. Los viajes sin parada fija, o con
    /// una parada fija que ya no corresponde a un participante con ubicación cargada, no se
    /// calculan y se informan en <see cref="RecorridoModel.RecalculoRepartoResponse.Pendientes"/>.
    /// </summary>
    Task<RecorridoModel.RecalculoRepartoResponse> RecalcularAsync(CancellationToken cancellationToken = default);

    /// <summary>Todas las paradas fijas marcadas, con etiqueta de horario y apellido del titular.</summary>
    Task<List<ParadaFijaModel.Response>> ObtenerParadasFijasAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Marca (o reasigna) la parada fija de un viaje. Valida que el titular elegido viaje
    /// realmente en ese horario con ese vehículo y que tenga ubicación cargada.
    /// </summary>
    /// <exception cref="Exceptions.ValidationException">
    /// Si el titular no viaja en ese horario con ese transporte, o no tiene ubicación cargada.
    /// </exception>
    Task<ParadaFijaModel.Response> AsignarParadaFijaAsync(
        int horarioId,
        byte transporte,
        int titularId,
        CancellationToken cancellationToken = default);

    /// <summary>Borra la parada fija de un viaje. No falla si no existía.</summary>
    Task EliminarParadaFijaAsync(int horarioId, byte transporte, CancellationToken cancellationToken = default);

    /// <summary>
    /// Recorrido calculado de un viaje, con sus paradas en orden de visita.
    /// Devuelve <c>null</c> si ese viaje todavía no se repartió.
    /// </summary>
    Task<RecorridoViajeModel.Response?> ObtenerRecorridoViajeAsync(
        int horarioId,
        byte transporte,
        CancellationToken cancellationToken = default);
}
