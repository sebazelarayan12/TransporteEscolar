using System.Security.Cryptography;
using System.Text;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Api.Authentication;

/// <summary>Un cliente ya resuelto: nombre, hash SHA-256 de su clave y sus alcances.</summary>
public sealed record ApiClient(string Name, byte[] KeyHash, IReadOnlyList<string> Scopes);

/// <summary>
/// Catálogo de clientes de la API, armado una sola vez al arrancar desde la configuración.
/// Solo guarda el hash de cada clave; la clave en claro no se conserva.
/// </summary>
public sealed class ApiClientCatalog
{
    public const string NombreBotInasistencias = "BotInasistencias";
    public const string ScopeBotIdentidad = "bot:identidad";

    private readonly IReadOnlyList<ApiClient> _clientes;

    /// <param name="configurados">Sección <c>ApiClients</c>: nombre → opciones.</param>
    /// <param name="claveBotHeredada">Alias heredado <c>BotApi:ApiKey</c>; equivale al cliente BotInasistencias.</param>
    public ApiClientCatalog(IReadOnlyDictionary<string, ApiClientOptions> configurados, string? claveBotHeredada)
    {
        var lista = new List<ApiClient>();

        foreach (var (nombre, opciones) in configurados)
        {
            if (string.IsNullOrWhiteSpace(opciones.Key))
                continue;

            lista.Add(new ApiClient(nombre, Hashear(opciones.Key), opciones.Scopes.ToArray()));
        }

        // El alias solo vale si BotInasistencias no se configuró explícitamente con una clave.
        var yaConfigurado = lista.Any(c => c.Name == NombreBotInasistencias);
        if (!yaConfigurado && !string.IsNullOrWhiteSpace(claveBotHeredada))
            lista.Add(new ApiClient(NombreBotInasistencias, Hashear(claveBotHeredada), new[] { ScopeBotIdentidad }));

        _clientes = lista;
    }

    /// <summary>Falso = no hay ninguna clave configurada: la API del bot debe responder 503 (falla cerrado).</summary>
    public bool HayClientes => _clientes.Count > 0;

    /// <summary>
    /// Devuelve el cliente dueño de la clave, o null. Recorre TODOS los clientes sin cortar en el primer
    /// acierto y compara hashes en tiempo constante, para no filtrar información por tiempos.
    /// </summary>
    public ApiClient? Resolver(string claveRecibida)
    {
        var hashRecibido = Hashear(claveRecibida);
        ApiClient? encontrado = null;

        foreach (var cliente in _clientes)
        {
            if (CryptographicOperations.FixedTimeEquals(cliente.KeyHash, hashRecibido))
                encontrado = cliente;
        }

        return encontrado;
    }

    private static byte[] Hashear(string valor) => SHA256.HashData(Encoding.UTF8.GetBytes(valor));
}
