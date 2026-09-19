using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Orquesta el cálculo y la lectura de recorridos.</summary>
public interface IRecorridoService
{
    /// <summary>
    /// Recalcula los recorridos de un titular. Solo consulta el motor para los pares
    /// (titular, colegio) cuyo hash cambió.
    /// </summary>
    /// <exception cref="Exceptions.ValidationException">Si el titular no tiene ubicación cargada.</exception>
    Task<RecorridoModel.RecalculoResponse> RecalcularPorTitularAsync(
        int titularId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Recalcula los recorridos de todos los titulares con ubicación cargada.
    /// Los titulares sin pin se informan en el resultado, no interrumpen la corrida.
    /// </summary>
    Task<RecorridoModel.RecalculoResponse> RecalcularTodosAsync(CancellationToken cancellationToken = default);

    /// <summary>Lee los recorridos ya calculados de un titular. No consulta el motor.</summary>
    Task<List<RecorridoModel.Response>> ObtenerPorTitularAsync(
        int titularId,
        CancellationToken cancellationToken = default);
}
