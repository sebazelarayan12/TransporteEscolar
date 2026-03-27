using System.Linq;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;

namespace TransporteEscolar.Application.Pasajeros.Queries;

public sealed record GetPasajerosSinHorariosQuery : IRequest<List<PasajeroModel.SinHorarioResponse>>;

public sealed class GetPasajerosSinHorariosQueryHandler
    : IRequestHandler<GetPasajerosSinHorariosQuery, List<PasajeroModel.SinHorarioResponse>>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetPasajerosSinHorariosQueryHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<PasajeroModel.SinHorarioResponse>> Handle(
        GetPasajerosSinHorariosQuery request,
        CancellationToken cancellationToken)
    {
        var pasajeros = await _pasajeroRepository.GetActivosSinHorariosAsync(cancellationToken);
        return pasajeros.Select(p => p.ToSinHorarioResponse()).ToList();
    }
}
