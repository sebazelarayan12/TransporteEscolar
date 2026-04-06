using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Infrastructure.Repositories;

public class PushSubscriptionRepository : IPushSubscriptionRepository
{
    private readonly AppDbContext _context;

    public PushSubscriptionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PushSubscription?> GetByEndpointAsync(string endpoint, CancellationToken cancellationToken = default)
    {
        return await _context.PushSubscriptions
            .FirstOrDefaultAsync(p => p.Endpoint == endpoint, cancellationToken);
    }

    public async Task<List<PushSubscription>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PushSubscriptions
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(PushSubscription subscription, CancellationToken cancellationToken = default)
    {
        _context.PushSubscriptions.Add(subscription);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(PushSubscription subscription, CancellationToken cancellationToken = default)
    {
        _context.PushSubscriptions.Update(subscription);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        await _context.PushSubscriptions
            .Where(p => p.Id == id)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task DeleteByEndpointAsync(string endpoint, CancellationToken cancellationToken = default)
    {
        await _context.PushSubscriptions
            .Where(p => p.Endpoint == endpoint)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
