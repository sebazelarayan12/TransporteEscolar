namespace TransporteEscolar.Application.DTOs;

public record ReinscripcionModel
{
    public record Request(int PasajeroId, int Anio);

    public record Response(
        int Id,
        int PasajeroId,
        int Anio,
        string Estado,
        DateTime FechaCreacion,
        DateTime? FechaConfirmacion);
    
    // DTO con datos completos para el frontend (incluye datos de Pasajero y Titular)
    public record ResponseDetallada(
        int Id,
        int PasajeroId,
        string PasajeroNombre,
        string TitularNombre,
        string Colegio,
        string Curso,
        string Turno,
        int Anio,
        string Estado, // "Pendiente" | "Confirmado" | "NoContinua"
        DateTime FechaCreacion,
        DateTime? FechaConfirmacion);
}
