namespace TransporteEscolar.Api.Authentication;

/// <summary>Nombres de las políticas de autorización basadas en el esquema ApiKey.</summary>
public static class ApiPolicies
{
    /// <summary>Exige un cliente ApiKey con el alcance <c>bot:identidad</c> (bot de inasistencias).</summary>
    public const string BotIdentidad = "ApiKey:BotIdentidad";

    /// <summary>Persona logueada (JWT) o cliente ApiKey con el alcance <c>lectura:bot-local</c>. Para los 4 GET del bot local.</summary>
    public const string LecturaBotLocal = "ApiKey:LecturaBotLocal";
}
