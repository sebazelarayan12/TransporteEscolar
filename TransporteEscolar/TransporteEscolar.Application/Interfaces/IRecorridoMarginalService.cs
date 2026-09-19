using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Calcula cuánto crece el recorrido de cada viaje por incluir a cada familia.
/// </summary>
public interface IRecorridoMarginalService
{
    /// <summary>
    /// Recalcula los aportes marginales de todos los pares (horario, vehículo).
    /// Es una operación cara: hace N+1 consultas al motor por cada viaje.
    /// </summary>
    Task<RecorridoModel.RecalculoMarginalResponse> RecalcularAsync(CancellationToken cancellationToken = default);
}
