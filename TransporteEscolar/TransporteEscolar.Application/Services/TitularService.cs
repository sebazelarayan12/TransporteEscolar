using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class TitularService : ITitularService
{
    private readonly ITitularRepository _repository;
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly INotificacionService _notificacionService;
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public TitularService(
        ITitularRepository repository, 
        IPasajeroRepository pasajeroRepository,
        INotificacionService notificacionService,
        IPagoMensualRepository pagoMensualRepository)
    {
        _repository = repository;
        _pasajeroRepository = pasajeroRepository;
        _notificacionService = notificacionService;
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<TitularModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var titular = await _repository.GetByIdAsync(id, cancellationToken);
        return titular != null ? MapearAResponse(titular) : null;
    }

    public async Task<List<TitularModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var titulares = await _repository.GetAllAsync(cancellationToken);
        return titulares.Select(MapearAResponse).ToList();
    }

    public async Task<List<TitularModel.Response>> ObtenerActivosAsync(CancellationToken cancellationToken = default)
    {
        var titulares = await _repository.GetActivosAsync(cancellationToken);
        return titulares.Select(MapearAResponse).ToList();
    }

    public async Task<List<TitularModel.SinTelefonoResponse>> ObtenerSinTelefonosAsync(CancellationToken cancellationToken = default)
    {
        var titulares = await _repository.GetSinTelefonosActivosAsync(cancellationToken);
        return titulares.Select(TitularMapper.MapearSinTelefono).ToList();
    }

    public async Task<PaginationModel.ResponsePagination<TitularModel.Response>> ObtenerPaginadosAsync(
        PaginationModel.FilterRequest request, 
        CancellationToken cancellationToken = default)
    {
        var titularesActivos = await _repository.GetActivosAsync(cancellationToken);
        var titularesFiltrados = titularesActivos.AsQueryable();
        
        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchLower = request.Search.ToLower();
            titularesFiltrados = titularesFiltrados.Where(t => 
                t.Apellido.ToLower().Contains(searchLower) ||
                t.NombreContacto.ToLower().Contains(searchLower) ||
                t.Direccion.ToLower().Contains(searchLower));
        }

        var titularesOrdenados = titularesFiltrados.OrderBy(t => t.Apellido);
        var totalCount = titularesOrdenados.Count();

        var titularesPaginados = titularesOrdenados
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(MapearAResponse)
            .ToList();

        return new PaginationModel.ResponsePagination<TitularModel.Response>(
            titularesPaginados,
            totalCount);
    }

    public async Task<TitularModel.Response> CrearAsync(TitularModel.Request dto, CancellationToken cancellationToken = default)
    {
        TitularValidator.Validate(dto);

        var titular = new Titular(
            dto.Apellido, 
            dto.NombreContacto, 
            dto.Direccion, 
            dto.MontoMensualPactado,
            dto.FechaAlta);
        var titularCreado = await _repository.AddAsync(titular, cancellationToken);

        // Crear notificación de titular creado
        var titularNombre = $"{titularCreado.NombreContacto} {titularCreado.Apellido}".Trim();
        await _notificacionService.CrearNotificacionTitularCreadoAsync(
            titularNombre,
            titularCreado.Id,
            cancellationToken);
        
        return MapearAResponse(titularCreado);
    }

    public async Task ActualizarAsync(int id, TitularModel.UpdateRequest dto, CancellationToken cancellationToken = default)
    {
        TitularValidator.ValidateUpdate(dto);

        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Titular), cancellationToken);

        titular.ActualizarDatos(dto.Apellido, dto.NombreContacto, dto.Direccion, dto.MontoMensualPactado);
        await _repository.UpdateAsync(titular, cancellationToken);
    }

    public async Task DarDeBajaAsync(int id, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Titular), cancellationToken);
        var pasajeros = await _pasajeroRepository.GetByTitularIdAsync(id, cancellationToken);
        var pasajerosActivos = pasajeros.Where(p => p.FechaBaja == null).ToList();

        titular.DarDeBaja();

        // Cascada manual para mantener la consistencia de estado con los pasajeros activos
        foreach (var pasajero in pasajerosActivos)
        {
            pasajero.DarDeBaja();
            await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        }

        await _repository.UpdateAsync(titular, cancellationToken);
        await _pagoMensualRepository.DeleteByTitularIdAsync(titular.Id, cancellationToken);
    }

    public async Task ReactivarAsync(int id, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Titular), cancellationToken);
        var pasajeros = await _pasajeroRepository.GetByTitularIdAsync(id, cancellationToken);
        var pasajerosDadosDeBaja = pasajeros.Where(p => p.FechaBaja != null).ToList();

        titular.Reactivar();

        foreach (var pasajero in pasajerosDadosDeBaja)
        {
            pasajero.Reactivar();
            await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        }

        await _repository.UpdateAsync(titular, cancellationToken);
    }

    public async Task<List<TelefonoModel.Response>> ObtenerTelefonosAsync(int titularId, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, titularId, nameof(Titular), cancellationToken);

        return titular.Telefonos
            .Where(t => t.FechaBaja == null)
            .Select(t => new TelefonoModel.Response(
                t.Id, t.NumeroE164, t.EsPrincipal, t.FechaAlta, t.FechaBaja, t.FechaBaja == null))
            .ToList();
    }

    public async Task<TelefonoModel.Response> AgregarTelefonoAsync(int titularId, TelefonoModel.Request dto, CancellationToken cancellationToken = default)
    {
        TelefonoValidator.Validate(dto);

        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, titularId, nameof(Titular), cancellationToken);

        var noHayTelefonosActivos = !titular.Telefonos.Any(t => t.FechaBaja == null);
        var esPrincipal = noHayTelefonosActivos || dto.EsPrincipal;

        if (esPrincipal)
        {
            foreach (var tel in titular.Telefonos.Where(t => t.EsPrincipal && t.FechaBaja == null))
            {
                tel.DesmarcarComoPrincipal();
            }
        }

        var telefono = new TitularTelefono(titularId, dto.NumeroE164, esPrincipal);
        titular.Telefonos.Add(telefono);

        await _repository.UpdateAsync(titular, cancellationToken);

        return new TelefonoModel.Response(
            telefono.Id, telefono.NumeroE164, telefono.EsPrincipal, 
            telefono.FechaAlta, telefono.FechaBaja, telefono.FechaBaja == null);
    }

    public async Task ActualizarTelefonoAsync(int titularId, int telefonoId, TelefonoModel.UpdateRequest dto, CancellationToken cancellationToken = default)
    {
        TelefonoValidator.Validate(new TelefonoModel.Request(dto.NumeroE164, false));

        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, titularId, nameof(Titular), cancellationToken);

        var telefono = titular.Telefonos.FirstOrDefault(t => t.Id == telefonoId && t.FechaBaja == null);
        if (telefono == null)
            throw new Exceptions.NotFoundException(nameof(TitularTelefono), telefonoId);

        telefono.ActualizarNumero(dto.NumeroE164);

        await _repository.UpdateAsync(titular, cancellationToken);
    }

    public async Task MarcarTelefonoComoPrincipalAsync(int titularId, int telefonoId, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, titularId, nameof(Titular), cancellationToken);

        var telefono = titular.Telefonos.FirstOrDefault(t => t.Id == telefonoId);
        if (telefono == null)
            throw new Exceptions.NotFoundException(nameof(TitularTelefono), telefonoId);

        foreach (var tel in titular.Telefonos.Where(t => t.EsPrincipal && t.FechaBaja == null))
        {
            tel.DesmarcarComoPrincipal();
        }

        telefono.MarcarComoPrincipal();
        await _repository.UpdateAsync(titular, cancellationToken);
    }

    public async Task EliminarTelefonoAsync(int titularId, int telefonoId, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, titularId, nameof(Titular), cancellationToken);

        var telefono = titular.Telefonos.FirstOrDefault(t => t.Id == telefonoId);
        if (telefono == null)
            throw new Exceptions.NotFoundException(nameof(TitularTelefono), telefonoId);

        telefono.DarDeBaja();
        await _repository.UpdateAsync(titular, cancellationToken);
    }

    private static TitularModel.Response MapearAResponse(Titular titular) =>
        TitularMapper.MapearAResponse(titular);
}
