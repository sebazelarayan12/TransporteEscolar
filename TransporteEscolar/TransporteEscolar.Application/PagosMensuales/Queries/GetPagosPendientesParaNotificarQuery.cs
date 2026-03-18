using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.PagosMensuales.Queries;

public sealed record GetPagosPendientesParaNotificarQuery : IRequest<List<PagoMensualModel.NotificarItem>>;

internal sealed class GetPagosPendientesParaNotificarQueryHandler
    : IRequestHandler<GetPagosPendientesParaNotificarQuery, List<PagoMensualModel.NotificarItem>>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly IWhatsAppLoteRepository _whatsAppLoteRepository;

    public GetPagosPendientesParaNotificarQueryHandler(
        IPagoMensualRepository pagoMensualRepository,
        IWhatsAppLoteRepository whatsAppLoteRepository)
    {
        _pagoMensualRepository = pagoMensualRepository;
        _whatsAppLoteRepository = whatsAppLoteRepository;
    }

    public async Task<List<PagoMensualModel.NotificarItem>> Handle(
        GetPagosPendientesParaNotificarQuery request,
        CancellationToken cancellationToken)
    {
        var hoyArgentina = DateTime.UtcNow.AddHours(-3); // UTC-3 (Argentina)
        var mesActual = hoyArgentina.Month;
        var anioActual = hoyArgentina.Year;

        var pagos = await _pagoMensualRepository.GetByMesAnioAsync(mesActual, anioActual, cancellationToken);
        var pendientes = pagos.Where(p => !p.EstaPagado() && p.SaldoPendiente() > 0).ToList();

        if (pendientes.Count == 0)
        {
            return [];
        }

        var titularIds = pendientes.Select(p => p.TitularId).Distinct().ToList();
        var titulares = await _whatsAppLoteRepository.ObtenerTitularesActivosConTelefonoAsync(titularIds, cancellationToken);
        var telefonosPorTitular = titulares.ToDictionary(t => t.TitularId, t => t);
        var periodo = $"{mesActual:D2}/{anioActual}";

        return pendientes
            .Where(p => telefonosPorTitular.TryGetValue(p.TitularId, out _))
            .Select(p =>
            {
                var titular = telefonosPorTitular[p.TitularId];
                return new PagoMensualModel.NotificarItem(
                    p.TitularId,
                    $"{titular.NombreContacto} {titular.Apellido}".Trim(),
                    titular.TelefonoPrincipal,
                    p.SaldoPendiente(),
                    periodo);
            })
            .OrderBy(item => item.NombreCompleto)
            .ToList();
    }
}
