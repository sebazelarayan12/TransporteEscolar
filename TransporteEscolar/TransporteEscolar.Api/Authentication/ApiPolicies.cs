namespace TransporteEscolar.Api.Authentication;

/// <summary>Nombres de las políticas de autorización basadas en el esquema ApiKey.</summary>
public static class ApiPolicies
{
    /// <summary>Exige un cliente ApiKey con el alcance <c>bot:identidad</c> (bot de inasistencias).</summary>
    public const string BotIdentidad = "ApiKey:BotIdentidad";
}
