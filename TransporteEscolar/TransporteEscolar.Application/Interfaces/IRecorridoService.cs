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

    /// <summary>Lee el pin de un titular. Devuelve null si nunca se cargó.</summary>
    Task<UbicacionModel.Response?> ObtenerUbicacionAsync(
        int titularId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Guarda o mueve el pin de un titular y recalcula sus recorridos en la misma operación.
    /// </summary>
    /// <exception cref="Exceptions.NotFoundException">Si el titular no existe.</exception>
    /// <exception cref="Exceptions.ValidationException">Si las coordenadas son inválidas.</exception>
    Task<UbicacionModel.Response> GuardarUbicacionAsync(
        int titularId,
        UbicacionModel.Request request,
        CancellationToken cancellationToken = default);

    /// <summary>Borra el pin de un titular y todos sus recorridos calculados.</summary>
    Task EliminarUbicacionAsync(int titularId, CancellationToken cancellationToken = default);

    /// <summary>Lista los colegios activos con sus coordenadas.</summary>
    Task<List<ColegioModel.Response>> ObtenerColegiosAsync(CancellationToken cancellationToken = default);
}
