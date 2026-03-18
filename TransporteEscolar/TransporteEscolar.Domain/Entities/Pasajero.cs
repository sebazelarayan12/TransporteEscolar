using System.Collections.Generic;
using System.Linq;

namespace TransporteEscolar.Domain.Entities;

public class Pasajero
{
    public int Id { get; private set; }
    public int TitularId { get; private set; }
    public string Nombre { get; private set; } = null!;
    public string Colegio { get; private set; } = null!;
    public string GradoCurso { get; private set; } = null!;
    public string Turno { get; private set; } = null!;
    public string? Observaciones { get; private set; }
    public DateTime FechaAlta { get; private set; }
    public DateTime? FechaBaja { get; private set; }

    // Navegación
    public Titular Titular { get; private set; } = null!;
    public ICollection<PasajeroHorario> PasajeroHorarios { get; private set; } = null!;
    public ICollection<ReinscripcionPasajero> Reinscripciones { get; private set; } = null!;

    // Constructor para EF Core
    private Pasajero()
    {
        PasajeroHorarios = new List<PasajeroHorario>();
        Reinscripciones = new List<ReinscripcionPasajero>();
    }

    // Constructor para creación
    public Pasajero(
        int titularId,
        string nombre,
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones = null,
        DateTime? fechaAlta = null)
    {
        TitularId = titularId;
        Nombre = nombre;
        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
        var referencia = fechaAlta ?? DateTime.UtcNow;
        FechaAlta = NormalizarFechaUtc(referencia);
        PasajeroHorarios = new List<PasajeroHorario>();
        Reinscripciones = new List<ReinscripcionPasajero>();
    }

    public void ActualizarDatos(
        string nombre,
        string colegio,
        string gradoCurso,
        string turno,
        string? observaciones)
    {
        Nombre = nombre;
        Colegio = colegio;
        GradoCurso = gradoCurso;
        Turno = turno;
        Observaciones = observaciones;
    }

    public void DarDeBaja()
    {
        FechaBaja = NormalizarFechaUtc(DateTime.UtcNow);
    }

    public void Reactivar()
    {
        FechaBaja = null;
    }

    public string NombreCompleto() => $"{Nombre} {Titular.Apellido}";

    public PasajeroHorario AsignarOActualizarHorario(
        int horarioId,
        bool esPrincipal,
        int? prioridad = null,
        byte? transporte = null)
    {
        var prioridadCalculada = prioridad.HasValue && prioridad.Value > 0
            ? prioridad.Value
            : ObtenerSiguientePrioridad();

        var transporteCalculado = PasajeroHorario.NormalizarTransporte(transporte);

        var existente = PasajeroHorarios.FirstOrDefault(ph => ph.HorarioId == horarioId);
        if (existente is null)
        {
            existente = new PasajeroHorario(Id, horarioId, esPrincipal, prioridadCalculada, transporteCalculado);
            PasajeroHorarios.Add(existente);
        }
        else
        {
            existente.DefinirPrincipal(esPrincipal);
            existente.ActualizarPrioridad(prioridadCalculada);
            existente.ActualizarTransporte(transporteCalculado);
            if (esPrincipal)
            {
                existente.ActualizarFechaAsignacion();
            }
        }

        if (esPrincipal)
        {
            EstablecerHorarioPrincipal(horarioId);
        }

        return existente;
    }

    public void EstablecerHorarioPrincipal(int horarioId)
    {
        var asignacion = PasajeroHorarios.FirstOrDefault(ph => ph.HorarioId == horarioId);
        if (asignacion == null)
        {
            var prioridad = ObtenerSiguientePrioridad();
            asignacion = new PasajeroHorario(Id, horarioId, true, prioridad, PasajeroHorario.NormalizarTransporte(1));
            PasajeroHorarios.Add(asignacion);
        }

        foreach (var ph in PasajeroHorarios)
        {
            var esPrincipal = ph.HorarioId == horarioId;
            ph.DefinirPrincipal(esPrincipal);
            if (esPrincipal)
            {
                ph.ActualizarFechaAsignacion();
            }
        }
    }

    public bool QuitarHorario(int horarioId)
    {
        var asignacion = PasajeroHorarios.FirstOrDefault(ph => ph.HorarioId == horarioId);
        if (asignacion == null)
        {
            return false;
        }

        var eraPrincipal = asignacion.EsPrincipal;
        PasajeroHorarios.Remove(asignacion);

        if (eraPrincipal)
        {
            PromoverSiguientePrincipal();
        }

        return true;
    }

    public bool QuitarHorarioPrincipal()
    {
        var principal = PasajeroHorarios.FirstOrDefault(ph => ph.EsPrincipal)
            ?? PasajeroHorarios.FirstOrDefault();

        if (principal == null)
        {
            return false;
        }

        PasajeroHorarios.Remove(principal);
        PromoverSiguientePrincipal();
        return true;
    }

    public void PromoverSiguientePrincipal()
    {
        if (PasajeroHorarios.Count == 0)
        {
            return;
        }

        var siguiente = PasajeroHorarios
            .OrderBy(ph => ph.Prioridad)
            .ThenBy(ph => ph.FechaAsignacion)
            .First();

        foreach (var asignacion in PasajeroHorarios)
        {
            var esPrincipal = asignacion == siguiente;
            asignacion.DefinirPrincipal(esPrincipal);
            if (esPrincipal)
            {
                asignacion.ActualizarFechaAsignacion();
            }
        }
    }

    public int ObtenerSiguientePrioridad()
    {
        if (PasajeroHorarios.Count == 0)
        {
            return 1;
        }

        return PasajeroHorarios.Max(ph => ph.Prioridad) + 1;
    }

    public ReinscripcionPasajero CrearReinscripcion(int anio)
    {
        if (Reinscripciones.Any(r => r.Anio == anio))
        {
            throw new InvalidOperationException($"Ya existe una reinscripción para el año {anio}");
        }

        var reinscripcion = new ReinscripcionPasajero(Id, anio);
        Reinscripciones.Add(reinscripcion);
        return reinscripcion;
    }

    public void ConfirmarReinscripcion(int reinscripcionId)
    {
        var reinscripcion = ObtenerReinscripcion(reinscripcionId);
        reinscripcion.Confirmar();
    }

    public void MarcarReinscripcionNoContinua(int reinscripcionId)
    {
        var reinscripcion = ObtenerReinscripcion(reinscripcionId);
        reinscripcion.MarcarComoNoContinua();
    }

    public IReadOnlyCollection<ReinscripcionPasajero> GetReinscripcionesResponses()
    {
        return Reinscripciones
            .OrderByDescending(r => r.FechaCreacion)
            .ToList()
            .AsReadOnly();
    }

    private ReinscripcionPasajero ObtenerReinscripcion(int reinscripcionId)
    {
        var reinscripcion = Reinscripciones.FirstOrDefault(r => r.Id == reinscripcionId);
        if (reinscripcion == null)
        {
            throw new ArgumentException($"No se encontró la reinscripción {reinscripcionId}", nameof(reinscripcionId));
        }

        return reinscripcion;
    }

    private static DateTime NormalizarFechaUtc(DateTime valor)
    {
        var fechaUtc = valor.Kind switch
        {
            DateTimeKind.Utc => valor,
            DateTimeKind.Local => valor.ToUniversalTime(),
            _ => DateTime.SpecifyKind(valor, DateTimeKind.Utc)
        };

        return DateTime.SpecifyKind(fechaUtc.Date, DateTimeKind.Utc);
    }
}
