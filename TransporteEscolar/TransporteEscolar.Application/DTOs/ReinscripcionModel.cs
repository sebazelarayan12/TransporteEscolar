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

    public record FilterRequest(
        int Anio = 2024,
        string? Estado = null,
        int Mes = 0,
        int PageNumber = 1,
        int PageSize = 20);

    /// <summary>
    /// Información del monto estimado que se utilizará al confirmar una reinscripción.
    /// </summary>
    public record PrecioPrevioResponse(
        int ReinscripcionId,
        int PasajeroId,
        string PasajeroNombre,
        int TitularId,
        string TitularNombreCompleto,
        decimal MontoBase,
        decimal DescuentosAplicados,
        decimal RecargosAplicados,
        decimal TotalCalculado);

    /// <summary>
    /// Representa un pasajero pendiente dentro de las alertas, sin importar si ya existe la reinscripción.
    /// Cuando <paramref name="TieneReinscripcion"/> es falso el registro usa Id 0 y describe que falta crear la reinscripción.
    /// </summary>
    public record AlertItem(
        int ReinscripcionId,
        int PasajeroId,
        string PasajeroNombre,
        int TitularId,
        string TitularNombre,
        string Estado,
        DateTime FechaCreacion,
        bool TieneReinscripcion);

    /// <summary>
    /// Resumen anual de alertas de pago. Solo incluye titulares activos con al menos un pasajero pendiente,
    /// ya sea porque la reinscripción está en estado "Pendiente" o porque todavía no se generó.
    /// Para esos titulares se listan también las reinscripciones marcadas como "NoContinua".
    /// </summary>
    public record AlertasPagoResponse(
        int Anio,
        IReadOnlyList<AlertItem> Pendientes,
        IReadOnlyList<AlertItem> NoContinua);
}
