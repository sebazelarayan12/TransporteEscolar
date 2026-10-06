using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Application.Helpers;

/// <summary>
/// Protege la invariante "un horario inactivo no tiene pasajeros activos": impide reactivar a un
/// pasajero que conserva la asignación a un horario dado de baja. Solo lee: no modifica nada, así
/// que se invoca ANTES de cualquier cambio de estado.
/// </summary>
public static class HorariosActivosGuard
{
    /// <summary>
    /// Verifica que ningún pasajero de la lista esté asignado a un horario inactivo.
    /// </summary>
    /// <param name="pasajeros">Pasajeros que se quieren reactivar.</param>
    /// <param name="pasajeroHorarioRepository">Para leer las asignaciones de cada pasajero.</param>
    /// <param name="horarioRepository">Para saber cuáles de esos horarios están inactivos.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    /// <exception cref="BusinessRuleException">Si algún pasajero está asignado a un horario inactivo.</exception>
    public static async Task AsegurarQueNoTenganHorariosInactivosAsync(
        IEnumerable<Pasajero> pasajeros,
        IPasajeroHorarioRepository pasajeroHorarioRepository,
        IHorarioRepository horarioRepository,
        CancellationToken cancellationToken = default)
    {
        var conflictos = new List<(string Nombre, List<string> Etiquetas)>();

        foreach (var pasajero in pasajeros)
        {
            var asignaciones = await pasajeroHorarioRepository.GetByPasajeroIdAsync(pasajero.Id, cancellationToken);
            if (asignaciones.Count == 0)
                continue;

            var inactivos = await horarioRepository.GetInactivosPorIdsAsync(
                asignaciones.Select(a => a.HorarioId).Distinct().ToList(),
                cancellationToken);

            if (inactivos.Count > 0)
                conflictos.Add((pasajero.Nombre, inactivos.Select(h => h.Etiqueta).ToList()));
        }

        if (conflictos.Count == 0)
            return;

        throw new BusinessRuleException(ArmarMensaje(conflictos));
    }

    private static string ArmarMensaje(List<(string Nombre, List<string> Etiquetas)> conflictos)
    {
        if (conflictos.Count == 1)
        {
            var (nombre, etiquetas) = conflictos[0];
            var detalle = etiquetas.Count == 1
                ? $"está asignado al horario inactivo \"{etiquetas[0]}\""
                : $"está asignado a los horarios inactivos {string.Join(", ", etiquetas.Select(e => $"\"{e}\""))}";

            return $"No se puede reactivar a {nombre}: {detalle}. " +
                   "Reactivá ese horario o quitale la asignación primero.";
        }

        var lista = string.Join("; ", conflictos.Select(c =>
            $"{c.Nombre} ({string.Join(", ", c.Etiquetas.Select(e => $"\"{e}\""))})"));

        return $"No se puede reactivar: hay pasajeros asignados a horarios inactivos: {lista}. " +
               "Reactivá esos horarios o quitales la asignación primero.";
    }
}
