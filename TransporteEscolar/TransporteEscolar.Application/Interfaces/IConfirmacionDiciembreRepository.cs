using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

public interface IConfirmacionDiciembreRepository
{
    /// <summary>Indica si el titular tiene al menos un pasajero activo.</summary>
    Task<bool> TienePasajerosActivosAsync(int titularId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Titulares activos con al menos un pasajero activo, con su decisión y su cuota de diciembre del año.
    /// Se arma con pocas consultas en lote (sin N+1). Orden: apellido, nombre de contacto.
    /// </summary>
    Task<List<DiciembreTitularDatos>> GetListadoAsync(int anio, int? titularId, CancellationToken cancellationToken = default);

    /// <summary>Decisión del titular para el año, con seguimiento para poder modificarla. Null si está pendiente.</summary>
    Task<ConfirmacionDiciembre?> GetConfirmacionAsync(int titularId, int anio, CancellationToken cancellationToken = default);

    /// <summary>Cuota mes 12 del titular y año, con seguimiento y sus movimientos cargados. Null si no existe.</summary>
    Task<PagoMensual?> GetCuotaDiciembreAsync(int titularId, int anio, CancellationToken cancellationToken = default);

    void AgregarConfirmacion(ConfirmacionDiciembre confirmacion);
    void AgregarCuota(PagoMensual cuota);
    void EliminarCuota(PagoMensual cuota);

    /// <summary>Persiste todos los cambios pendientes en un único SaveChanges.</summary>
    Task GuardarCambiosAsync(CancellationToken cancellationToken = default);
}

/// <summary>Datos de un titular para el listado de diciembre. <c>Va</c> null significa sin decisión (pendiente).</summary>
public sealed record DiciembreTitularDatos(
    int TitularId,
    string Apellido,
    string NombreContacto,
    decimal MontoPactado,
    IReadOnlyList<string> Pasajeros,
    bool? Va,
    DiciembreCuotaDatos? Cuota);

/// <summary>Cuota mes 12 existente: su id, monto generado y total ya pagado.</summary>
public sealed record DiciembreCuotaDatos(int PagoMensualId, decimal Monto, decimal TotalPagado);
