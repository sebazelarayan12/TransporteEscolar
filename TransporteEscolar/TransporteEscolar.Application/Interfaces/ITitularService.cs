using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface ITitularService
{
    Task<TitularModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<TitularModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default);
    Task<List<TitularModel.Response>> ObtenerActivosAsync(CancellationToken cancellationToken = default);
    Task<TitularModel.Response> CrearAsync(TitularModel.Request dto, CancellationToken cancellationToken = default);
    Task ActualizarAsync(int id, TitularModel.UpdateRequest dto, CancellationToken cancellationToken = default);
    Task DarDeBajaAsync(int id, CancellationToken cancellationToken = default);
    Task ReactivarAsync(int id, CancellationToken cancellationToken = default);
    
    // Gestión de teléfonos
    Task<List<TelefonoModel.Response>> ObtenerTelefonosAsync(int titularId, CancellationToken cancellationToken = default);
    Task<TelefonoModel.Response> AgregarTelefonoAsync(int titularId, TelefonoModel.Request dto, CancellationToken cancellationToken = default);
    Task MarcarTelefonoComoPrincipalAsync(int titularId, int telefonoId, CancellationToken cancellationToken = default);
    Task EliminarTelefonoAsync(int titularId, int telefonoId, CancellationToken cancellationToken = default);
}
