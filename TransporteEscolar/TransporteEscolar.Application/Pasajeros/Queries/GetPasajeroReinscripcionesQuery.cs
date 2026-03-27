using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajeroReinscripcionesQuery(int PasajeroId) : IRequest<List<ReinscripcionModel.Response>>;

public sealed class GetPasajeroReinscripcionesQueryHandler : IRequestHandler<GetPasajeroReinscripcionesQuery, List<ReinscripcionModel.Response>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajeroReinscripcionesQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<ReinscripcionModel.Response>> Handle(GetPasajeroReinscripcionesQuery request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        return pasajero.GetReinscripcionesResponses().ToResponses();
    }
}
