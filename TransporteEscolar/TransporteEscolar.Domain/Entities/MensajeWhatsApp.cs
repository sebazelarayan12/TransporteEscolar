namespace TransporteEscolar.Domain.Entities;

public class MensajeWhatsApp
{
    public int Id { get; private set; }
    public int LoteId { get; private set; }
    public int TitularId { get; private set; }
    public string TelefonoDestino { get; private set; } = null!;
    public string NombreTitular { get; private set; } = null!;
    public string Estado { get; private set; } = null!;       // Pendiente, Enviado, Entregado, Leido, Error
    public string? ProviderMessageId { get; private set; }    // ID devuelto por Meta/Twilio
    public string? DetalleError { get; private set; }
    public int Intentos { get; private set; }
    public DateTime FechaCreacion { get; private set; }
    public DateTime FechaActualizacion { get; private set; }

    // Navegación
    public LoteWhatsApp Lote { get; private set; } = null!;
    public Titular Titular { get; private set; } = null!;

    // Constructor para EF Core
    private MensajeWhatsApp() { }

    // Constructor para creación
    public MensajeWhatsApp(int loteId, int titularId, string telefonoDestino, string nombreTitular)
    {
        LoteId = loteId;
        TitularId = titularId;
        TelefonoDestino = LimpiarTelefono(telefonoDestino);
        NombreTitular = nombreTitular;
        Estado = EstadoMensaje.Pendiente;
        Intentos = 0;
        FechaCreacion = DateTime.UtcNow;
        FechaActualizacion = DateTime.UtcNow;
    }

    /// <summary>Registra el envío exitoso y el ID devuelto por el proveedor.</summary>
    public void MarcarEnviado(string providerMessageId)
    {
        Estado = EstadoMensaje.Enviado;
        ProviderMessageId = providerMessageId;
        Intentos++;
        FechaActualizacion = DateTime.UtcNow;
    }

    /// <summary>Llamado desde el webhook cuando Meta confirma entrega.</summary>
    public void MarcarEntregado()
    {
        Estado = EstadoMensaje.Entregado;
        FechaActualizacion = DateTime.UtcNow;
    }

    /// <summary>Llamado desde el webhook cuando Meta informa que fue leído.</summary>
    public void MarcarLeido()
    {
        Estado = EstadoMensaje.Leido;
        FechaActualizacion = DateTime.UtcNow;
    }

    /// <summary>Registra un error (permite reintentos posteriores).</summary>
    public void MarcarError(string detalleError)
    {
        Estado = EstadoMensaje.Error;
        DetalleError = detalleError;
        Intentos++;
        FechaActualizacion = DateTime.UtcNow;
    }

    private static string LimpiarTelefono(string telefono)
    {
        // Conserva únicamente dígitos para el formato E.164 requerido por Meta
        var soloDigitos = new string(telefono.Where(char.IsDigit).ToArray());
        return soloDigitos;
    }
}

public static class EstadoMensaje
{
    public const string Pendiente  = "Pendiente";
    public const string Enviado    = "Enviado";
    public const string Entregado  = "Entregado";
    public const string Leido      = "Leido";
    public const string Error      = "Error";
}
