namespace TransporteEscolar.Domain.Entities;

public class Notificacion
{
    public int Id { get; private set; }
    public string Tipo { get; private set; } = null!;        // "PAGO_REGISTRADO", "AJUSTE_MONTO", "REINSCRIPCION", "TITULAR_CREADO", "PASAJERO_CREADO"
    public string Titulo { get; private set; } = null!;      // "Nuevo pago registrado"
    public string Mensaje { get; private set; } = null!;     // "Juan Pérez pagó $50,000 para Marzo 2026"
    public DateTime FechaCreacion { get; private set; }
    public bool Leida { get; private set; }
    public DateTime? FechaLectura { get; private set; }
    public string? EntidadTipo { get; private set; }         // "Titular", "PagoMensual", "Pasajero", "Reinscripcion"
    public int? EntidadId { get; private set; }              // ID para navegación en frontend

    // Constructor para EF Core
    private Notificacion() { }

    // Constructor para creación
    public Notificacion(string tipo, string titulo, string mensaje, string? entidadTipo = null, int? entidadId = null)
    {
        Tipo = tipo;
        Titulo = titulo;
        Mensaje = mensaje;
        FechaCreacion = DateTime.UtcNow;
        Leida = false;
        EntidadTipo = entidadTipo;
        EntidadId = entidadId;
    }

    public void MarcarComoLeida()
    {
        if (!Leida)
        {
            Leida = true;
            FechaLectura = DateTime.UtcNow;
        }
    }
}
