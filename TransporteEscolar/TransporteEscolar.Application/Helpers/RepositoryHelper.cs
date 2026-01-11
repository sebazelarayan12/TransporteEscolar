using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Application.Helpers;

public static class RepositoryHelper
{
    public static async Task<T> GetByIdOrThrowAsync<T>(
        Func<int, CancellationToken, Task<T?>> getByIdFunc,
        int id,
        string entityName,
        CancellationToken cancellationToken = default) where T : class
    {
        var entity = await getByIdFunc(id, cancellationToken);
        if (entity == null)
            throw new NotFoundException(entityName, id);

        return entity;
    }

    public static T GetByIdOrThrow<T>(
        Func<int, T?> getByIdFunc,
        int id,
        string entityName) where T : class
    {
        var entity = getByIdFunc(id);
        if (entity == null)
            throw new NotFoundException(entityName, id);

        return entity;
    }
}
