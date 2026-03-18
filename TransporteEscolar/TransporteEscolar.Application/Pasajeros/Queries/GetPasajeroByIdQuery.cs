using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajeroByIdQuery(int PasajeroId) : IRequest<PasajeroModel.Response?>;

public sealed class GetPasajeroByIdQueryHandler : IRequestHandler<GetPasajeroByIdQuery, PasajeroModel.Response?>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajeroByIdQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<PasajeroModel.Response?> Handle(GetPasajeroByIdQuery request, CancellationToken cancellationToken)
    {
        var pasajero = await _pasajeroRepository.GetByIdAsync(request.PasajeroId, cancellationToken);
        return pasajero?.ToResponse();
    }
}
