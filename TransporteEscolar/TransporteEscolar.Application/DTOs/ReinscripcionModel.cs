namespace TransporteEscolar.Application.DTOs;

public record ReinscripcionModel
{
    public record Request(int Anio);

    public record Response(
        int Id,
        int PasajeroId,
        int Anio,
        string Estado,
        DateTime FechaCreacion,
        DateTime? FechaConfirmacion);
}
