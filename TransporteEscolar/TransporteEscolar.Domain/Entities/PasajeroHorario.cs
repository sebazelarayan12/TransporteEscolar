using System;

namespace TransporteEscolar.Domain.Entities;

public class PasajeroHorario
{
    public int Id { get; private set; }
    public int PasajeroId { get; private set; }
    public int HorarioId { get; private set; }
    public bool EsPrincipal { get; private set; }
    public int Prioridad { get; private set; }
    public byte Transporte { get; private set; }
    public DateTime FechaAsignacion { get; private set; }

    public Pasajero Pasajero { get; private set; } = null!;
    public Horario Horario { get; private set; } = null!;

    private PasajeroHorario()
    {
    }

    public PasajeroHorario(
        int pasajeroId,
        int horarioId,
        bool esPrincipal,
        int prioridad,
        byte transporte = 1,
        DateTime? fechaAsignacion = null)
    {
        PasajeroId = pasajeroId;
        HorarioId = horarioId;
        EsPrincipal = esPrincipal;
        Prioridad = prioridad;
        Transporte = ValidarTransporte(transporte);
        FechaAsignacion = NormalizarFechaUtc(fechaAsignacion ?? DateTime.UtcNow);
    }

    public void DefinirPrincipal(bool esPrincipal)
    {
        EsPrincipal = esPrincipal;
    }

    public void ActualizarPrioridad(int prioridad)
    {
        Prioridad = prioridad;
    }

    public void ActualizarTransporte(byte transporte)
    {
        Transporte = ValidarTransporte(transporte);
    }

    public void ActualizarFechaAsignacion(DateTime? fechaAsignacion = null)
    {
        FechaAsignacion = NormalizarFechaUtc(fechaAsignacion ?? DateTime.UtcNow);
    }

    public static byte NormalizarTransporte(byte? transporte)
    {
        if (!transporte.HasValue)
        {
            return 1;
        }

        return ValidarTransporte(transporte.Value);
    }

    private static DateTime NormalizarFechaUtc(DateTime valor)
    {
        var fechaUtc = valor.Kind switch
        {
            DateTimeKind.Utc => valor,
            DateTimeKind.Local => valor.ToUniversalTime(),
            _ => DateTime.SpecifyKind(valor, DateTimeKind.Utc)
        };

        return DateTime.SpecifyKind(fechaUtc, DateTimeKind.Utc);
    }

    private static byte ValidarTransporte(byte transporte)
    {
        if (transporte is 1 or 2)
            return transporte;

        throw new ArgumentOutOfRangeException(nameof(transporte), transporte, "El transporte debe ser 1 o 2");
    }
}
