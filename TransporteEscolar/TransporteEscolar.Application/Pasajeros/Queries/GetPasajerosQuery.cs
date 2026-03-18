using System.Linq;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajerosQuery : IRequest<List<PasajeroModel.Response>>;

public sealed class GetPasajerosQueryHandler : IRequestHandler<GetPasajerosQuery, List<PasajeroModel.Response>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajerosQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<PasajeroModel.Response>> Handle(GetPasajerosQuery request, CancellationToken cancellationToken)
    {
        var pasajeros = await _pasajeroRepository.GetAllAsync(cancellationToken);
        return pasajeros.Select(p => p.ToResponse()).ToList();
    }
}
