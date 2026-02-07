namespace TransporteEscolar.Application.DTOs;

public record PaginationModel
{
    /// <summary>
    /// Request para filtrado y paginación
    /// </summary>
    public record FilterRequest(
        string? Search = null,
        int PageNumber = 1,
        int PageSize = 20);

    /// <summary>
    /// Response genérico con datos paginados y total de registros
    /// </summary>
    public record ResponsePagination<T>(
        List<T> Data,
        int TotalCount);
}
