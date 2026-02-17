using Microsoft.EntityFrameworkCore;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Infrastructure.Persistence.Configurations;

namespace TransporteEscolar.Infrastructure.Persistence;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Titular> Titulares => Set<Titular>();
    public DbSet<TitularTelefono> TitularesTelefonos => Set<TitularTelefono>();
    public DbSet<Pasajero> Pasajeros => Set<Pasajero>();
    public DbSet<PasajeroHorario> PasajeroHorarios => Set<PasajeroHorario>();
    public DbSet<Horario> Horarios => Set<Horario>();
    public DbSet<PagoMensual> PagosMensuales => Set<PagoMensual>();
    public DbSet<PagoMovimiento> PagosMovimientos => Set<PagoMovimiento>();
    public DbSet<ReinscripcionPasajero> ReinscripcionesPasajeros => Set<ReinscripcionPasajero>();
    public DbSet<GastoFijoTemplate> GastosFijosTemplates => Set<GastoFijoTemplate>();
    public DbSet<GastoMensual> GastosMensuales => Set<GastoMensual>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Aplicar configuraciones explícitamente (workaround para asegurar que se carguen)
        modelBuilder.ApplyConfiguration(new TitularConfiguration());
        modelBuilder.ApplyConfiguration(new TitularTelefonoConfiguration());
        modelBuilder.ApplyConfiguration(new PasajeroConfiguration());
        modelBuilder.ApplyConfiguration(new PasajeroHorarioConfiguration());
        modelBuilder.ApplyConfiguration(new HorarioConfiguration());
        modelBuilder.ApplyConfiguration(new PagoMensualConfiguration());
        modelBuilder.ApplyConfiguration(new PagoMovimientoConfiguration());
        modelBuilder.ApplyConfiguration(new ReinscripcionPasajeroConfiguration());
        modelBuilder.ApplyConfiguration(new GastoFijoTemplateConfiguration());
        modelBuilder.ApplyConfiguration(new GastoMensualConfiguration());
    }
}
