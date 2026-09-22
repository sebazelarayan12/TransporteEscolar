using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class TitularUbicacionConfiguration : IEntityTypeConfiguration<TitularUbicacion>
{
    public void Configure(EntityTypeBuilder<TitularUbicacion> builder)
    {
        builder.ToTable("TitularesUbicaciones");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .ValueGeneratedOnAdd();

        builder.Property(u => u.TitularId)
            .IsRequired();

        builder.Property(u => u.Latitud)
            .IsRequired();

        builder.Property(u => u.Longitud)
            .IsRequired();

        builder.Property(u => u.DireccionNormalizada)
            .HasMaxLength(300);

        builder.Property(u => u.Fuente)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(u => u.FechaActualizacion)
            .IsRequired();

        // Uno a uno: un titular tiene como máximo una ubicación.
        builder.HasIndex(u => u.TitularId)
            .IsUnique();

        builder.HasOne(u => u.Titular)
            .WithOne()
            .HasForeignKey<TitularUbicacion>(u => u.TitularId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
