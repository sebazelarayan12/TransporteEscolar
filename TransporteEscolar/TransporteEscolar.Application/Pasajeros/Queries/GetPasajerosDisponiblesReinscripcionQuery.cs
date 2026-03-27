using System.Linq;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajerosDisponiblesReinscripcionQuery(int Anio) : IRequest<List<PasajeroModel.Response>>;

public sealed class GetPasajerosDisponiblesReinscripcionQueryHandler : IRequestHandler<GetPasajerosDisponiblesReinscripcionQuery, List<PasajeroModel.Response>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajerosDisponiblesReinscripcionQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<PasajeroModel.Response>> Handle(GetPasajerosDisponiblesReinscripcionQuery request, CancellationToken cancellationToken)
    {
        var pasajeros = await _pasajeroRepository.GetActivosDisponiblesParaReinscripcionAsync(request.Anio, cancellationToken);
        return pasajeros.Select(p => p.ToResponse()).ToList();
    }
}
