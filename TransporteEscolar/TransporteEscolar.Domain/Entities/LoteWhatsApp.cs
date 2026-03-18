namespace TransporteEscolar.Domain.Entities;

public class LoteWhatsApp
{
    public int Id { get; private set; }
    public string Estado { get; private set; } = null!;       // Pendiente, Procesando, Completado, Fallido
    public string TipoMensaje { get; private set; } = null!;  // CobroMensual (extensible)
    public string? Descripcion { get; private set; }
    public DateTime FechaCreacion { get; private set; }
    public DateTime? FechaFinalizacion { get; private set; }

    // Navegación
    public ICollection<MensajeWhatsApp> Mensajes { get; private set; } = null!;

    // Constructor para EF Core
    private LoteWhatsApp()
    {
        Mensajes = new List<MensajeWhatsApp>();
    }

    // Constructor para creación
    public LoteWhatsApp(string tipoMensaje, string? descripcion = null)
    {
        TipoMensaje = tipoMensaje;
        Descripcion = descripcion;
        Estado = EstadoLote.Pendiente;
        FechaCreacion = DateTime.UtcNow;
        Mensajes = new List<MensajeWhatsApp>();
    }

    public void IniciarProcesamiento()
    {
        Estado = EstadoLote.Procesando;
    }

    public void Completar()
    {
        Estado = EstadoLote.Completado;
        FechaFinalizacion = DateTime.UtcNow;
    }

    public void Fallar()
    {
        Estado = EstadoLote.Fallido;
        FechaFinalizacion = DateTime.UtcNow;
    }
}

public static class EstadoLote
{
    public const string Pendiente   = "Pendiente";
    public const string Procesando  = "Procesando";
    public const string Completado  = "Completado";
    public const string Fallido     = "Fallido";
}
