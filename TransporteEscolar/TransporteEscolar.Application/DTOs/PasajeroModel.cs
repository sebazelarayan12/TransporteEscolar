namespace TransporteEscolar.Application.DTOs;

public record PasajeroModel
{
    public record Request(
        int TitularId,
        string Nombre,
        string Colegio,
        string GradoCurso,
        string Turno,
        string? Observaciones,
        DateTime? FechaAlta = null); // Opcional: si no se especifica, usa fecha actual

    public record UpdateRequest(
        string Nombre,
        string Colegio,
        string GradoCurso,
        string Turno,
        string? Observaciones);

    public record Response(
        int Id,
        int TitularId,
        string Nombre,
        string Apellido,
        string NombreCompleto,
        string Colegio,
        string GradoCurso,
        string Turno,
        string? Observaciones,
        DateTime FechaAlta,
        DateTime? FechaBaja,
        bool Activo,
        string? TitularApellido);
}
