using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class ParadaFijaConfiguration : IEntityTypeConfiguration<ParadaFija>
{
    public void Configure(EntityTypeBuilder<ParadaFija> builder)
    {
        builder.ToTable("ParadasFijas");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .ValueGeneratedOnAdd();

        builder.Property(p => p.HorarioId)
            .IsRequired();

        builder.Property(p => p.Transporte)
            .IsRequired();

        builder.Property(p => p.TitularId)
            .IsRequired();

        builder.Property(p => p.FechaAsignacion)
            .IsRequired();

        // Una sola parada fija por viaje (horario, vehículo).
        builder.HasIndex(p => new { p.HorarioId, p.Transporte })
            .IsUnique();

        builder.HasOne<Horario>()
            .WithMany()
            .HasForeignKey(p => p.HorarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Titular>()
            .WithMany()
            .HasForeignKey(p => p.TitularId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
