using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class PasajeroConfiguration : IEntityTypeConfiguration<Pasajero>
{
    public void Configure(EntityTypeBuilder<Pasajero> builder)
    {
        builder.ToTable("Pasajeros");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .ValueGeneratedOnAdd();

        builder.Property(p => p.TitularId)
            .IsRequired();

        builder.Property(p => p.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Apellido)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Colegio)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.GradoCurso)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Turno)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Observaciones)
            .IsRequired(false)
            .HasMaxLength(500);

        builder.Property(p => p.FechaAlta)
            .IsRequired();

        builder.Property(p => p.FechaBaja)
            .IsRequired(false);

        // Relación con Titular
        builder.HasOne(p => p.Titular)
            .WithMany() // No definimos colección en Titular por ahora
            .HasForeignKey(p => p.TitularId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índice único: TitularId + Nombre + Apellido
        builder.HasIndex(p => new { p.TitularId, p.Nombre, p.Apellido })
            .IsUnique();
    }
}