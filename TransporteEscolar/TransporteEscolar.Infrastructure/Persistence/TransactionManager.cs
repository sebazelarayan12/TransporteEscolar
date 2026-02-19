using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Infrastructure.Persistence;

/// <summary>
/// Implementación del gestor de transacciones usando EF Core
/// </summary>
public class TransactionManager : ITransactionManager
{
    private readonly AppDbContext _context;

    public TransactionManager(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        return new TransactionScope(transaction);
    }
}

/// <summary>
/// Wrapper de IDbContextTransaction que implementa ITransactionScope
/// </summary>
internal class TransactionScope : ITransactionScope
{
    private readonly IDbContextTransaction _transaction;

    public TransactionScope(IDbContextTransaction transaction)
    {
        _transaction = transaction;
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        await _transaction.CommitAsync(cancellationToken);
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        await _transaction.RollbackAsync(cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        await _transaction.DisposeAsync();
    }
}
