namespace TransporteEscolar.Application.Interfaces;

/// <summary>
/// Administrador de transacciones para operaciones atómicas
/// </summary>
public interface ITransactionManager
{
    /// <summary>
    /// Inicia una nueva transacción
    /// </summary>
    Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Representa el alcance de una transacción
/// </summary>
public interface ITransactionScope : IAsyncDisposable
{
    /// <summary>
    /// Confirma la transacción
    /// </summary>
    Task CommitAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Revierte la transacción
    /// </summary>
    Task RollbackAsync(CancellationToken cancellationToken = default);
}
