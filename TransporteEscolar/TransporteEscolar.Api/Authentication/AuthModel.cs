namespace TransporteEscolar.Api.Authentication;

public record AuthModel
{
    public record LoginRequest(string? Usuario, string? Password);

    public record LoginResponse(string Token, DateTime ExpiraEn);
}
