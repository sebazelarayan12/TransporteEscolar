using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IIngresoRepository
{
    Task<List<IngresoMensual>> ObtenerIngresosPorMesAsync(int mes, int anio, CancellationToken cancellationToken = default);
    Task<IngresoMensual> AgregarIngresoMensualAsync(IngresoMensual ingreso, CancellationToken cancellationToken = default);
    Task<IngresoFijoTemplate> AgregarTemplateAsync(IngresoFijoTemplate template, CancellationToken cancellationToken = default);
    Task<List<IngresoFijoTemplate>> ObtenerTemplatesActivosHastaMesAsync(DateTime fechaLimite, CancellationToken cancellationToken = default);
    Task<bool> ExisteIngresoMensualParaTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default);
    Task<decimal> ObtenerTotalPorTipoAsync(int mes, int anio, string tipo, CancellationToken cancellationToken = default);
}
