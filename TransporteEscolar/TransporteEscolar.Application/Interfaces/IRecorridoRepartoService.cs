using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Reparte los kilómetros de cada viaje entre las familias que lo componen usando el
/// valor de Shapley.
/// </summary>
public interface IRecorridoRepartoService
{
    /// <summary>
    /// Recalcula el reparto de todos los pares (horario, vehículo).
    /// Hace una sola consulta al motor de ruteo por viaje (la matriz de distancias);
    /// el reparto se calcula después en memoria.
    /// </summary>
    Task<RecorridoModel.RecalculoRepartoResponse> RecalcularAsync(CancellationToken cancellationToken = default);
}
