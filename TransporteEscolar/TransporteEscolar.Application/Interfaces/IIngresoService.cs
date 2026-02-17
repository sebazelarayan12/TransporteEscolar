using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Interfaces;

public interface IIngresoService
{
    Task<IngresoModel.ResumenMensualResponse> ObtenerResumenMensualAsync(int mes, int anio, CancellationToken cancellationToken = default);
    Task<IngresoModel.IngresoMensualResponse> RegistrarIngresoFijoAsync(IngresoModel.IngresoFijoRequest dto, CancellationToken cancellationToken = default);
    Task<IngresoModel.IngresoMensualResponse> RegistrarIngresoVariableAsync(IngresoModel.IngresoVariableRequest dto, CancellationToken cancellationToken = default);
    Task<IngresoModel.IngresoMensualResponse> ActualizarIngresoFijoAsync(int templateId, IngresoModel.UpdateIngresoFijoRequest dto, CancellationToken cancellationToken = default);
    Task DesactivarIngresoFijoAsync(int templateId, CancellationToken cancellationToken = default);
    Task EliminarIngresoVariableAsync(int ingresoId, CancellationToken cancellationToken = default);
}
