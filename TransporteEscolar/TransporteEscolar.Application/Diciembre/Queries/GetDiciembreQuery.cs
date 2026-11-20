using MediatR;
using TransporteEscolar.Application.Diciembre.DTOs;
using TransporteEscolar.Application.Diciembre.Mappers;
using TransporteEscolar.Application.Diciembre.Validation;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.Diciembre.Queries;

/// <summary>Listado de diciembre: titulares activos con su decisión y cuota. Sin <c>Anio</c>, usa el año en curso (UTC).</summary>
public sealed record GetDiciembreQuery(int? Anio) : IRequest<DiciembreModel.Response>;

public sealed class GetDiciembreQueryHandler : IRequestHandler<GetDiciembreQuery, DiciembreModel.Response>
{
    private readonly IConfirmacionDiciembreRepository _repository;

    public GetDiciembreQueryHandler(IConfirmacionDiciembreRepository repository)
    {
        _repository = repository;
    }

    public async Task<DiciembreModel.Response> Handle(GetDiciembreQuery request, CancellationToken cancellationToken)
    {
        var anio = request.Anio ?? DateTime.UtcNow.Year;
        DiciembreValidator.ValidarAnio(anio);

        var filas = await _repository.GetListadoAsync(anio, null, cancellationToken);

        return new DiciembreModel.Response(anio, filas.Select(f => f.ToItem()).ToList());
    }
}
