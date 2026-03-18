using System.Linq;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajerosPorTitularQuery(int TitularId) : IRequest<List<PasajeroModel.Response>>;

public sealed class GetPasajerosPorTitularQueryHandler : IRequestHandler<GetPasajerosPorTitularQuery, List<PasajeroModel.Response>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajerosPorTitularQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<PasajeroModel.Response>> Handle(GetPasajerosPorTitularQuery request, CancellationToken cancellationToken)
    {
        var pasajeros = await _pasajeroRepository.GetByTitularIdAsync(request.TitularId, cancellationToken);
        return pasajeros.Select(p => p.ToResponse()).ToList();
    }
}
