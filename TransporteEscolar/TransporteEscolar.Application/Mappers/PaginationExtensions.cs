using TransporteEscolar.Application.DTOs;

namespace TransporteEscolar.Application.Mappers;

public static class PaginationExtensions
{
    public static PaginationModel.ResponsePagination<T> ToResponsePagination<T>(
        this IEnumerable<T> data,
        int totalCount)
        => new(data.ToList(), totalCount);
}
