using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IGastoService
{
    Task<GastoModel.ResumenMensualResponse> ObtenerResumenMensualAsync(int mes, int anio, CancellationToken cancellationToken = default);
    Task<GastoModel.GastoMensualResponse> RegistrarGastoFijoAsync(GastoModel.GastoFijoRequest dto, CancellationToken cancellationToken = default);
    Task<GastoModel.GastoMensualResponse> RegistrarGastoVariableAsync(GastoModel.GastoVariableRequest dto, CancellationToken cancellationToken = default);
}
