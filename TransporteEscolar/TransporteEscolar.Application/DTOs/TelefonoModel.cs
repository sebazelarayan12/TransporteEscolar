namespace TransporteEscolar.Application.DTOs;

public record TelefonoModel
{
    public record Request(string NumeroE164, bool EsPrincipal);

    public record Response(
        int Id,
        string NumeroE164,
        bool EsPrincipal,
        DateTime FechaAlta,
        DateTime? FechaBaja,
        bool Activo);
}
