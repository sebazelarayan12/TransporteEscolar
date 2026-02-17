using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IGastoRepository
{
    Task<List<GastoMensual>> ObtenerGastosPorMesAsync(int mes, int anio, CancellationToken cancellationToken = default);
    Task<List<GastoMensual>> ObtenerGastosPorTipoAsync(int mes, int anio, string tipo, CancellationToken cancellationToken = default);
    Task<GastoMensual> AgregarGastoMensualAsync(GastoMensual gasto, CancellationToken cancellationToken = default);
    Task<GastoFijoTemplate> AgregarTemplateAsync(GastoFijoTemplate template, CancellationToken cancellationToken = default);
    Task<List<GastoFijoTemplate>> ObtenerTemplatesActivosHastaMesAsync(DateTime fechaLimite, CancellationToken cancellationToken = default);
    Task<bool> ExisteGastoMensualParaTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default);
    Task<GastoFijoTemplate?> ObtenerTemplatePorIdAsync(int templateId, CancellationToken cancellationToken = default);
    Task<GastoFijoTemplate> ActualizarTemplateAsync(GastoFijoTemplate template, CancellationToken cancellationToken = default);
    Task<GastoMensual?> ObtenerGastoMensualPorTemplateAsync(int templateId, int mes, int anio, CancellationToken cancellationToken = default);
    Task<GastoMensual?> ObtenerGastoMensualPorIdAsync(int gastoId, CancellationToken cancellationToken = default);
    Task<GastoMensual> ActualizarGastoMensualAsync(GastoMensual gasto, CancellationToken cancellationToken = default);
    Task EliminarGastoMensualAsync(GastoMensual gasto, CancellationToken cancellationToken = default);
    Task<int> EliminarInstanciasFuturasPorTemplateAsync(int templateId, int mesCorte, int anioCorte, CancellationToken cancellationToken = default);
}
