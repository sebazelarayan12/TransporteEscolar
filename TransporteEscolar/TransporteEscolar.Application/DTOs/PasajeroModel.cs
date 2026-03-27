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
        int? HorarioId = null,
        DateTime? FechaAlta = null); // Opcional: si no se especifica, usa fecha actual

    public record UpdateRequest(
        string Nombre,
        string Colegio,
        string GradoCurso,
        string Turno,
        string? Observaciones,
        int? HorarioId);

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
        int? HorarioId,
        string? HorarioDescripcion,
        DateTime FechaAlta,
        DateTime? FechaBaja,
        bool Activo,
        string? TitularApellido,
        HorarioModel.Resumen? Horario,
        IReadOnlyList<PasajeroHorarioModel.Response> HorariosAsignados);

    public record SinHorarioResponse(
        int Id,
        string Nombre,
        string Apellido,
        string NombreTitular,
        string Colegio,
        string Turno);
}
