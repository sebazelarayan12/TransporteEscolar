using System.Globalization;
using MediatR;
using TransporteEscolar.Application.Diciembre.DTOs;
using TransporteEscolar.Application.Diciembre.Mappers;
using TransporteEscolar.Application.Diciembre.Validation;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Application.Diciembre.Commands;

/// <summary>
/// Registra si el titular va en diciembre. "Va" crea o adopta la cuota mes 12 con el monto indicado;
/// "no va" elimina la cuota si no tiene pagos. Idempotente. No envía notificaciones.
/// </summary>
public sealed record ConfirmarDiciembreCommand(int TitularId, int Anio, bool? Va, decimal? Monto)
    : IRequest<DiciembreModel.TitularItem>;

public sealed class ConfirmarDiciembreCommandHandler : IRequestHandler<ConfirmarDiciembreCommand, DiciembreModel.TitularItem>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IConfirmacionDiciembreRepository _repository;

    public ConfirmarDiciembreCommandHandler(
        ITitularRepository titularRepository,
        IConfirmacionDiciembreRepository repository)
    {
        _titularRepository = titularRepository;
        _repository = repository;
    }

    public async Task<DiciembreModel.TitularItem> Handle(ConfirmarDiciembreCommand request, CancellationToken cancellationToken)
    {
        DiciembreValidator.ValidarConfirmacion(request.Anio, request.Va, request.Monto);

        var titular = await _titularRepository.GetByIdAsync(request.TitularId, cancellationToken);
        if (titular is null)
            throw new NotFoundException(nameof(Titular), request.TitularId);

        if (titular.FechaBaja is not null || !await _repository.TienePasajerosActivosAsync(request.TitularId, cancellationToken))
            throw new BusinessRuleException("El titular no está activo o no tiene pasajeros activos: no corresponde confirmar diciembre");

        var cuota = await _repository.GetCuotaDiciembreAsync(request.TitularId, request.Anio, cancellationToken);
        var confirmacion = await _repository.GetConfirmacionAsync(request.TitularId, request.Anio, cancellationToken);
        var ahora = DateTime.UtcNow;

        if (request.Va == true)
        {
            var monto = request.Monto!.Value;

            if (cuota is null)
            {
                cuota = titular.GenerarPagoDiciembre(request.Anio, monto, Array.Empty<PagoMensual>());
                _repository.AgregarCuota(cuota);
            }
            else
            {
                if (monto < cuota.TotalPagado())
                {
                    throw new BusinessRuleException(
                        $"El monto (${monto.ToString("N2", CultureInfo.InvariantCulture)}) no puede ser menor al total pagado (${cuota.TotalPagado().ToString("N2", CultureInfo.InvariantCulture)}) de la cuota de diciembre");
                }

                cuota.ActualizarMontoGenerado(monto);
            }

            if (confirmacion is null)
            {
                confirmacion = new ConfirmacionDiciembre(request.TitularId, request.Anio, true, monto, cuota, ahora);
                _repository.AgregarConfirmacion(confirmacion);
            }
            else
            {
                confirmacion.RegistrarVa(monto, cuota, ahora);
            }
        }
        else
        {
            if (cuota is not null)
            {
                if (cuota.Movimientos.Count > 0)
                    throw new BusinessRuleException("No se puede marcar que no va: la cuota de diciembre ya tiene pagos registrados");

                _repository.EliminarCuota(cuota);
            }

            if (confirmacion is null)
            {
                confirmacion = new ConfirmacionDiciembre(request.TitularId, request.Anio, false, null, null, ahora);
                _repository.AgregarConfirmacion(confirmacion);
            }
            else
            {
                confirmacion.RegistrarNoVa(ahora);
            }
        }

        await _repository.GuardarCambiosAsync(cancellationToken);

        var fila = (await _repository.GetListadoAsync(request.Anio, request.TitularId, cancellationToken)).FirstOrDefault();
        if (fila is null)
            throw new NotFoundException(nameof(Titular), request.TitularId);

        return fila.ToItem();
    }
}
