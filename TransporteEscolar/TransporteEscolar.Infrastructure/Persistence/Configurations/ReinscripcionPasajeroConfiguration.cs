using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class ReinscripcionPasajeroConfiguration : IEntityTypeConfiguration<ReinscripcionPasajero>
{
    public void Configure(EntityTypeBuilder<ReinscripcionPasajero> builder)
    {
        builder.ToTable("ReinscripcionesPasajeros");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .ValueGeneratedOnAdd();

        builder.Property(r => r.PasajeroId)
            .IsRequired();

        builder.Property(r => r.Anio)
            .IsRequired();

        builder.Property(r => r.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(r => r.FechaCreacion)
            .IsRequired();

        builder.Property(r => r.FechaConfirmacion)
            .IsRequired(false);

        // Relación con Pasajero (bidireccional)
        builder.HasOne(r => r.Pasajero)
            .WithMany(p => p.Reinscripciones)
            .HasForeignKey(r => r.PasajeroId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índice único: PasajeroId + Anio
        builder.HasIndex(r => new { r.PasajeroId, r.Anio })
            .IsUnique();
    }
}