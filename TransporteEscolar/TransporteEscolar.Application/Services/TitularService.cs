using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class TitularService : ITitularService
{
    private readonly ITitularRepository _repository;

    public TitularService(ITitularRepository repository)
    {
        _repository = repository;
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

    public async Task<TitularModel.Response> CrearAsync(TitularModel.Request dto, CancellationToken cancellationToken = default)
    {
        TitularValidator.Validate(dto);

        var titular = new Titular(dto.Apellido, dto.NombreContacto, dto.Direccion, dto.MontoMensualPactado);
        var titularCreado = await _repository.AddAsync(titular, cancellationToken);
        
        return MapearAResponse(titularCreado);
    }

    public async Task ActualizarAsync(int id, TitularModel.UpdateRequest dto, CancellationToken cancellationToken = default)
    {
        TitularValidator.ValidateUpdate(dto);

        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Titular), cancellationToken);

        titular.ActualizarDatos(dto.NombreContacto, dto.Direccion, dto.MontoMensualPactado);
        await _repository.UpdateAsync(titular, cancellationToken);
    }

    public async Task DarDeBajaAsync(int id, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Titular), cancellationToken);

        titular.DarDeBaja();
        await _repository.UpdateAsync(titular, cancellationToken);
    }

    public async Task ReactivarAsync(int id, CancellationToken cancellationToken = default)
    {
        var titular = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Titular), cancellationToken);

        titular.Reactivar();
        await _repository.UpdateAsync(titular, cancellationToken);
    }


    // Gestión de teléfonos
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

        if (dto.EsPrincipal)
        {
            foreach (var tel in titular.Telefonos.Where(t => t.EsPrincipal && t.FechaBaja == null))
            {
                tel.DesmarcarComoPrincipal();
            }
        }

        var telefono = new TitularTelefono(titularId, dto.NumeroE164, dto.EsPrincipal);
        titular.Telefonos.Add(telefono);

        await _repository.UpdateAsync(titular, cancellationToken);

        return new TelefonoModel.Response(
            telefono.Id, telefono.NumeroE164, telefono.EsPrincipal, 
            telefono.FechaAlta, telefono.FechaBaja, telefono.FechaBaja == null);
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
        new(titular.Id, titular.Apellido, titular.NombreContacto, titular.Direccion,
            titular.MontoMensualPactado, titular.FechaAlta, titular.FechaBaja, titular.FechaBaja == null);
}
