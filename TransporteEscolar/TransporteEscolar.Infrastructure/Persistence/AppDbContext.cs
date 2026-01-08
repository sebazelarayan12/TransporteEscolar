using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Titular> Titulares => Set<Titular>();
    public DbSet<TitularTelefono> TitularesTelefonos => Set<TitularTelefono>();
    public DbSet<Pasajero> Pasajeros => Set<Pasajero>();
    public DbSet<PagoMensual> PagosMensuales => Set<PagoMensual>();
    public DbSet<PagoMovimiento> PagosMovimientos => Set<PagoMovimiento>();
    public DbSet<ReinscripcionPasajero> ReinscripcionesPasajeros => Set<ReinscripcionPasajero>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Aplicar todas las configuraciones del assembly actual
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}