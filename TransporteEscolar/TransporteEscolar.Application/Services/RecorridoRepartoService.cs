using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Services;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Application.Services;

/// <summary>
/// Reparte los kilómetros reales de cada viaje entre los titulares que lo componen,
/// usando el valor de Shapley, y administra la parada fija (la casa que arranca o cierra
/// el recorrido real) que cada viaje necesita para calcularse.
/// </summary>
/// <remarks>
/// Es la métrica honesta de costo: a diferencia del aporte marginal simple, el reparto
/// suma exactamente los kilómetros reales del recorrido y nunca da negativo. Por cada
/// viaje se hace una sola consulta al motor (la matriz de distancias); el reparto se
/// calcula después en memoria con <see cref="RepartoShapley"/>.
/// <para>
/// La lógica de la parada fija vive acá (y no en un servicio propio) porque está
/// intrínsecamente acoplada al cálculo del reparto: valida contra los mismos datos
/// (asignaciones de horario, ubicaciones) que ya usa <see cref="RecalcularAsync"/>, y
/// es, literalmente, el dato que ese cálculo necesita para poder correr.
/// </para>
/// </remarks>
public class RecorridoRepartoService : IRecorridoRepartoService
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly ITitularUbicacionRepository _ubicacionRepository;
    private readonly IColegioRepository _colegioRepository;
    private readonly IHorarioRepository _horarioRepository;
    private readonly IParadaFijaRepository _paradaFijaRepository;
    private readonly ITitularRepository _titularRepository;
    private readonly IRecorridoHorarioRepository _snapshotRepository;
    private readonly IRutaProvider _rutaProvider;
    private readonly RuteoOptions _options;
    private readonly ILogger<RecorridoRepartoService> _logger;

    public RecorridoRepartoService(
        IPasajeroRepository pasajeroRepository,
        ITitularUbicacionRepository ubicacionRepository,
        IColegioRepository colegioRepository,
        IHorarioRepository horarioRepository,
        IParadaFijaRepository paradaFijaRepository,
        ITitularRepository titularRepository,
        IRecorridoHorarioRepository snapshotRepository,
        IRutaProvider rutaProvider,
        IOptions<RuteoOptions> options,
        ILogger<RecorridoRepartoService> logger)
    {
        _pasajeroRepository = pasajeroRepository ?? throw new ArgumentNullException(nameof(pasajeroRepository));
        _ubicacionRepository = ubicacionRepository ?? throw new ArgumentNullException(nameof(ubicacionRepository));
        _colegioRepository = colegioRepository ?? throw new ArgumentNullException(nameof(colegioRepository));
        _horarioRepository = horarioRepository ?? throw new ArgumentNullException(nameof(horarioRepository));
        _paradaFijaRepository = paradaFijaRepository ?? throw new ArgumentNullException(nameof(paradaFijaRepository));
        _titularRepository = titularRepository ?? throw new ArgumentNullException(nameof(titularRepository));
        _snapshotRepository = snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));
        _rutaProvider = rutaProvider ?? throw new ArgumentNullException(nameof(rutaProvider));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RecorridoModel.RecalculoRepartoResponse> RecalcularAsync(
        CancellationToken cancellationToken = default)
    {
        var asignaciones = await _pasajeroRepository.GetAsignacionesHorarioAsync(cancellationToken);
        var ubicaciones = await _ubicacionRepository.GetAllAsync(cancellationToken);
        var colegios = await _colegioRepository.GetAllAsync(cancellationToken);
        var horarios = await _horarioRepository.GetConColegioAsync(cancellationToken);
        var paradasFijas = await _paradaFijaRepository.GetTodasAsync(cancellationToken);

        var ubicacionPorTitular = ubicaciones.ToDictionary(u => u.TitularId, u => u.ObtenerCoordenada());
        var colegioPorId = colegios.ToDictionary(c => c.Id, c => c.ObtenerCoordenada());
        var horarioPorId = horarios.ToDictionary(h => h.Id);
        var paradaFijaPorViaje = paradasFijas.ToDictionary(p => (p.HorarioId, p.Transporte));

        var procesados = 0;
        var consultas = 0;
        var fallidos = 0;
        var aproximados = 0;
        var pendientes = new List<RecorridoModel.ViajePendiente>();

        var viajes = asignaciones
            .GroupBy(a => (a.HorarioId, a.Transporte, a.ColegioId))
            .OrderBy(g => g.Key.HorarioId)
            .ThenBy(g => g.Key.Transporte);

        foreach (var viaje in viajes)
        {
            cancellationToken.ThrowIfCancellationRequested();

            horarioPorId.TryGetValue(viaje.Key.HorarioId, out var horario);
            var etiqueta = horario?.Etiqueta ?? $"Horario {viaje.Key.HorarioId}";

            if (!colegioPorId.TryGetValue(viaje.Key.ColegioId, out var destino))
            {
                fallidos++;
                continue;
            }

            // Solo entran los titulares con pin cargado. Los demás no se pueden ubicar en la ruta.
            var participantes = viaje
                .Select(a => a.TitularId)
                .Distinct()
                .Where(ubicacionPorTitular.ContainsKey)
                .OrderBy(id => id)
                .ToList();

            if (participantes.Count == 0)
                continue;

            // La parada fija es obligatoria: sin ella el viaje no se calcula ni se consulta al
            // motor. Este chequeo va ANTES de pedir la matriz para no gastar consultas al pedo.
            if (!paradaFijaPorViaje.TryGetValue((viaje.Key.HorarioId, viaje.Key.Transporte), out var paradaFija))
            {
                pendientes.Add(new RecorridoModel.ViajePendiente(
                    viaje.Key.HorarioId,
                    etiqueta,
                    viaje.Key.Transporte,
                    "Falta marcar la casa fija de este viaje."));
                continue;
            }

            var indiceParadaFija = participantes.IndexOf(paradaFija.TitularId);
            if (indiceParadaFija < 0)
            {
                pendientes.Add(new RecorridoModel.ViajePendiente(
                    viaje.Key.HorarioId,
                    etiqueta,
                    viaje.Key.Transporte,
                    "La casa fija marcada ya no viaja en este horario (se fue del horario o le borraron la ubicación): reasigná la parada fija."));
                continue;
            }

            var paradas = participantes.Select(id => ubicacionPorTitular[id]).ToList();

            // Una sola consulta al motor por viaje: la matriz de distancias entre todas las
            // paradas y el colegio. El reparto se calcula después en memoria.
            var puntos = new List<Coordenada>(paradas) { destino };

            await EsperarAsync(cancellationToken);
            var matriz = await _rutaProvider.CalcularMatricesAsync(puntos, cancellationToken);
            consultas++;

            if (matriz is null)
            {
                _logger.LogWarning(
                    "No se pudo obtener la matriz del horario {HorarioId} transporte {Transporte}",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte);
                fallidos++;
                continue;
            }

            var extremo = horario?.Sentido == SentidoHorario.Vuelta
                ? ExtremoFijo.Ultima
                : ExtremoFijo.Primera;

            var reparto = RepartoShapley.Calcular(matriz.Distancias, paradas.Count, indiceParadaFija, extremo);

            if (reparto is null)
            {
                _logger.LogWarning(
                    "No hay recorrido posible para el horario {HorarioId} transporte {Transporte}",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte);
                fallidos++;
                continue;
            }

            if (!reparto.EsExacto)
            {
                aproximados++;
                _logger.LogInformation(
                    "El horario {HorarioId} transporte {Transporte} tiene {Cantidad} paradas: se repartió de forma aproximada",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte,
                    paradas.Count);
            }

            var indiceColegio = participantes.Count;

            // Los tramos salen del orden que ya calculó el algoritmo y de la matriz que ya tenemos:
            // no hace falta ninguna consulta extra al motor.
            var metrosTramoAnterior = new int[participantes.Count];
            var duracionTotal = 0d;

            for (var posicion = 0; posicion < reparto.Orden.Count; posicion++)
            {
                var paradaActual = reparto.Orden[posicion];

                if (posicion == 0)
                {
                    // En ida el recorrido arranca en esta casa; en vuelta viene del colegio.
                    if (extremo == ExtremoFijo.Ultima)
                    {
                        metrosTramoAnterior[paradaActual] = Redondear(matriz.Distancias[indiceColegio][paradaActual]);
                        duracionTotal += matriz.Duraciones[indiceColegio][paradaActual];
                    }

                    continue;
                }

                var paradaPrevia = reparto.Orden[posicion - 1];
                metrosTramoAnterior[paradaActual] = Redondear(matriz.Distancias[paradaPrevia][paradaActual]);
                duracionTotal += matriz.Duraciones[paradaPrevia][paradaActual];
            }

            var ultimaParada = reparto.Orden[^1];
            var metrosTramoFinal = 0;

            if (extremo == ExtremoFijo.Primera)
            {
                metrosTramoFinal = Redondear(matriz.Distancias[ultimaParada][indiceColegio]);
                duracionTotal += matriz.Duraciones[ultimaParada][indiceColegio];
            }

            var snapshot = new RecorridoHorario(
                viaje.Key.HorarioId,
                viaje.Key.Transporte,
                reparto.DistanciaTotalMetros,
                participantes.Count,
                metrosTramoFinal,
                Redondear(duracionTotal));

            // reparto.Orden es la secuencia de ÍNDICES de parada en orden de visita: el aporte de
            // participantes[i] necesita la POSICIÓN de i dentro de Orden (1-based), no al revés.
            // Ej.: Orden = [2, 0, 1] => la parada 2 lleva orden 1, la 0 lleva orden 2, la 1 orden 3.
            var ordenPorIndiceParada = new int[participantes.Count];
            for (var posicion = 0; posicion < reparto.Orden.Count; posicion++)
            {
                ordenPorIndiceParada[reparto.Orden[posicion]] = posicion + 1;
            }

            for (var indice = 0; indice < participantes.Count; indice++)
            {
                snapshot.AgregarAporte(
                    participantes[indice],
                    reparto.MetrosPorParada[indice],
                    ordenPorIndiceParada[indice],
                    metrosTramoAnterior[indice]);
            }

            await _snapshotRepository.UpsertAsync(snapshot, cancellationToken);
            procesados++;
        }

        _logger.LogInformation(
            "Reparto de kilómetros: {Procesados} viajes, {Consultas} consultas al motor, {Fallidos} fallidos, {Aproximados} aproximados, {Pendientes} pendientes de casa fija",
            procesados,
            consultas,
            fallidos,
            aproximados,
            pendientes.Count);

        return new RecorridoModel.RecalculoRepartoResponse(procesados, consultas, fallidos, aproximados, pendientes);
    }

    public async Task<List<ParadaFijaModel.Response>> ObtenerParadasFijasAsync(
        CancellationToken cancellationToken = default)
    {
        var paradasFijas = await _paradaFijaRepository.GetTodasAsync(cancellationToken);
        if (paradasFijas.Count == 0)
            return new List<ParadaFijaModel.Response>();

        var horarios = await _horarioRepository.GetConColegioAsync(cancellationToken);
        var etiquetaPorHorario = horarios.ToDictionary(h => h.Id, h => h.Etiqueta);

        var titularIds = paradasFijas.Select(p => p.TitularId).Distinct().ToList();
        var titulares = await _titularRepository.GetByIdsAsync(titularIds, cancellationToken);
        var apellidoPorTitular = titulares.ToDictionary(t => t.Id, t => t.Apellido);

        return paradasFijas
            .OrderBy(p => p.HorarioId)
            .ThenBy(p => p.Transporte)
            .Select(p => p.ToResponse(
                etiquetaPorHorario.TryGetValue(p.HorarioId, out var etiqueta) ? etiqueta : $"Horario {p.HorarioId}",
                apellidoPorTitular.TryGetValue(p.TitularId, out var apellido) ? apellido : string.Empty))
            .ToList();
    }

    public async Task<ParadaFijaModel.Response> AsignarParadaFijaAsync(
        int horarioId,
        byte transporte,
        int titularId,
        CancellationToken cancellationToken = default)
    {
        var asignaciones = await _pasajeroRepository.GetAsignacionesHorarioAsync(cancellationToken);

        var viaja = asignaciones.Any(a =>
            a.HorarioId == horarioId && a.Transporte == transporte && a.TitularId == titularId);

        if (!viaja)
            throw new ValidationException(
                "Ese titular no viaja en ese horario con ese vehículo. Revisá los pasajeros asignados.");

        var ubicacion = await _ubicacionRepository.GetByTitularIdAsync(titularId, cancellationToken);
        if (ubicacion is null)
            throw new ValidationException(
                "El titular no tiene ubicación cargada. Marcá la casa en el mapa antes de fijarla como parada.");

        ParadaFija paradaFija;
        try
        {
            paradaFija = new ParadaFija(horarioId, transporte, titularId);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            // El dominio valida los rangos; acá se traduce a un 400 legible para el frontend.
            throw new ValidationException($"La parada fija no es válida: {ex.Message}");
        }

        var guardada = await _paradaFijaRepository.UpsertAsync(paradaFija, cancellationToken);

        var horario = await _horarioRepository.GetByIdAsync(horarioId, cancellationToken);
        var titular = await _titularRepository.GetByIdAsync(titularId, cancellationToken);

        return guardada.ToResponse(horario?.Etiqueta ?? $"Horario {horarioId}", titular?.Apellido ?? string.Empty);
    }

    public async Task EliminarParadaFijaAsync(
        int horarioId,
        byte transporte,
        CancellationToken cancellationToken = default)
    {
        await _paradaFijaRepository.EliminarAsync(horarioId, transporte, cancellationToken);
    }

    public async Task<RecorridoViajeModel.Response?> ObtenerRecorridoViajeAsync(
        int horarioId,
        byte transporte,
        CancellationToken cancellationToken = default)
    {
        var snapshot = await _snapshotRepository.GetAsync(horarioId, transporte, cancellationToken);
        if (snapshot is null)
            return null;

        var horarios = await _horarioRepository.GetConColegioAsync(cancellationToken);
        var horarioDelViaje = horarios.FirstOrDefault(h => h.Id == horarioId);

        var etiqueta = horarioDelViaje?.Etiqueta ?? $"Horario {horarioId}";
        var sentido = (horarioDelViaje?.Sentido ?? SentidoHorario.Ida).ToString();
        var colegioNombre = horarioDelViaje?.Colegio?.Nombre ?? string.Empty;

        var paradaFija = await _paradaFijaRepository.GetAsync(horarioId, transporte, cancellationToken);

        var titularIds = snapshot.Aportes.Select(a => a.TitularId).ToList();
        var titulares = await _titularRepository.GetByIdsAsync(titularIds, cancellationToken);
        var apellidoPorTitular = titulares.ToDictionary(t => t.Id, t => t.Apellido);

        var paradas = snapshot.Aportes
            .OrderBy(a => a.Orden)
            .Select(a => new RecorridoViajeModel.Parada(
                a.Orden,
                a.TitularId,
                apellidoPorTitular.TryGetValue(a.TitularId, out var apellido) ? apellido : string.Empty,
                a.MetrosTramoAnterior,
                a.MetrosAsignados,
                paradaFija is not null && paradaFija.TitularId == a.TitularId))
            .ToList();

        return new RecorridoViajeModel.Response(
            horarioId,
            etiqueta,
            sentido,
            transporte,
            colegioNombre,
            snapshot.DistanciaTotalMetros,
            snapshot.DuracionTotalSegundos,
            snapshot.MetrosTramoFinal,
            snapshot.FechaCalculo,
            paradas);
    }

    private static int Redondear(double valor) => (int)Math.Round(valor, MidpointRounding.AwayFromZero);

    private async Task EsperarAsync(CancellationToken cancellationToken)
    {
        if (_options.PausaEntreConsultasMs <= 0)
            return;

        await Task.Delay(_options.PausaEntreConsultasMs, cancellationToken).ConfigureAwait(false);
    }
}
