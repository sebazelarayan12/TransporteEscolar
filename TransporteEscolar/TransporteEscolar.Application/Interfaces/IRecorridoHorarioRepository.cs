using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Interfaces;

/// <summary>Acceso a los snapshots de recorrido por horario y su reparto de kilómetros.</summary>
public interface IRecorridoHorarioRepository
{
    /// <summary>Todos los snapshots con sus aportes cargados.</summary>
    Task<List<RecorridoHorario>> GetAllConAportesAsync(CancellationToken cancellationToken = default);

    /// <summary>Crea o reemplaza el snapshot de un par (horario, transporte).</summary>
    Task UpsertAsync(RecorridoHorario snapshot, CancellationToken cancellationToken = default);

    /// <summary>Borra todos los snapshots. Se usa antes de un recálculo completo.</summary>
    Task LimpiarAsync(CancellationToken cancellationToken = default);
}
