using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record CreatePagoMensualCommand(PagoMensualModel.Request Payload) : IRequest<PagoMensualModel.Response>;

public sealed class CreatePagoMensualCommandHandler : IRequestHandler<CreatePagoMensualCommand, PagoMensualModel.Response>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly ITitularRepository _titularRepository;

    public CreatePagoMensualCommandHandler(
        IPagoMensualRepository pagoMensualRepository,
        ITitularRepository titularRepository)
    {
        _pagoMensualRepository = pagoMensualRepository;
        _titularRepository = titularRepository;
    }

    public async Task<PagoMensualModel.Response> Handle(CreatePagoMensualCommand request, CancellationToken cancellationToken)
    {
        PagoMensualValidator.Validate(request.Payload);

        var titular = await _titularRepository.GetByIdAsync(request.Payload.TitularId, cancellationToken);
        if (titular is null)
            throw new NotFoundException(nameof(Titular), request.Payload.TitularId);

        var existente = await _pagoMensualRepository.GetByTitularMesAnioAsync(
            request.Payload.TitularId,
            request.Payload.Mes,
            request.Payload.Anio,
            cancellationToken);

        if (existente != null)
        {
            throw new ValidationException(
                $"Ya existe un pago mensual para {request.Payload.Mes}/{request.Payload.Anio} del titular {request.Payload.TitularId}");
        }

        var pagoMensual = new PagoMensual(
            request.Payload.TitularId,
            request.Payload.Mes,
            request.Payload.Anio,
            request.Payload.MontoGenerado,
            request.Payload.Observaciones);

        var creado = await _pagoMensualRepository.AddAsync(pagoMensual, cancellationToken);
        return creado.ToResponse();
    }
}
