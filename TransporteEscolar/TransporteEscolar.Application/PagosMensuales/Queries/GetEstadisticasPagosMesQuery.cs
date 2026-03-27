using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetEstadisticasPagosMesQuery(int Mes, int Anio) : IRequest<PagoMensualModel.EstadisticasMes>;

public sealed class GetEstadisticasPagosMesQueryHandler : IRequestHandler<GetEstadisticasPagosMesQuery, PagoMensualModel.EstadisticasMes>
{
    private readonly IPagoMensualRepository _repository;

    public GetEstadisticasPagosMesQueryHandler(IPagoMensualRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagoMensualModel.EstadisticasMes> Handle(GetEstadisticasPagosMesQuery request, CancellationToken cancellationToken)
    {
        var pagos = await _repository.GetByMesAnioAsync(request.Mes, request.Anio, cancellationToken);

        var totalPagos = pagos.Count;
        var cantidadPagados = pagos.Count(p => p.EstaPagado());
        var cantidadVencidos = pagos.Count(p => p.EstaVencido());
        var cantidadPendientes = totalPagos - cantidadPagados - cantidadVencidos;
        var totalRecaudado = pagos.Sum(p => p.TotalPagado());
        var totalPendiente = pagos.Sum(p => p.SaldoPendiente());

        return new PagoMensualModel.EstadisticasMes(
            totalPagos,
            cantidadPagados,
            cantidadPendientes,
            cantidadVencidos,
            totalRecaudado,
            totalPendiente);
    }
}
