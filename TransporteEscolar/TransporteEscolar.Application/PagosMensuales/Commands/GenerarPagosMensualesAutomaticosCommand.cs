using MediatR;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record GenerarPagosMensualesAutomaticosCommand(int TitularId, int Anio) : IRequest<Unit>;

public sealed class GenerarPagosMensualesAutomaticosCommandHandler : IRequestHandler<GenerarPagosMensualesAutomaticosCommand, Unit>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public GenerarPagosMensualesAutomaticosCommandHandler(
        ITitularRepository titularRepository,
        IPagoMensualRepository pagoMensualRepository)
    {
        _titularRepository = titularRepository;
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<Unit> Handle(GenerarPagosMensualesAutomaticosCommand request, CancellationToken cancellationToken)
    {
        var titular = await _titularRepository.GetByIdAsync(request.TitularId, cancellationToken);
        if (titular is null)
            throw new NotFoundException(nameof(Titular), request.TitularId);

        var mesActual = DateTime.UtcNow.Month;
        var anioActual = DateTime.UtcNow.Year;

        if (request.Anio == anioActual && mesActual > 11)
            return Unit.Value;

        var mesInicio = request.Anio == anioActual ? mesActual : 3;
        var mesFin = 11;

        if (mesInicio < 3)
            mesInicio = 3;

        var pagosExistentes = await _pagoMensualRepository.GetByTitularIdAsync(request.TitularId, cancellationToken);
        var observacion = "Generado automáticamente al confirmar reinscripciones";

        var nuevosPagos = titular.GenerarPagos(
            request.TitularId,
            request.Anio,
            mesInicio,
            mesFin,
            titular.MontoMensualPactado,
            observacion,
            pagosExistentes);

        foreach (var pago in nuevosPagos)
        {
            await _pagoMensualRepository.AddAsync(pago, cancellationToken);
        }

        return Unit.Value;
    }
}
