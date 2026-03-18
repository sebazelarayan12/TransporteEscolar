using System.Linq;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajerosActivosQuery : IRequest<List<PasajeroModel.Response>>;

public sealed class GetPasajerosActivosQueryHandler : IRequestHandler<GetPasajerosActivosQuery, List<PasajeroModel.Response>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajerosActivosQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<PasajeroModel.Response>> Handle(GetPasajerosActivosQuery request, CancellationToken cancellationToken)
    {
        var pasajeros = await _pasajeroRepository.GetActivosAsync(cancellationToken);
        return pasajeros.Select(p => p.ToResponse()).ToList();
    }
}
