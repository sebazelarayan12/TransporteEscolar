using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class ColegioConfiguration : IEntityTypeConfiguration<Colegio>
{
    public void Configure(EntityTypeBuilder<Colegio> builder)
    {
        builder.ToTable("Colegios");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .ValueGeneratedOnAdd();

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Direccion)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(c => c.Latitud)
            .IsRequired();

        builder.Property(c => c.Longitud)
            .IsRequired();

        builder.Property(c => c.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        // El nombre es la clave de vinculación con Pasajero.Colegio, así que no puede repetirse.
        builder.HasIndex(c => c.Nombre)
            .IsUnique();

        // Coordenadas verificadas en OpenStreetMap durante la investigación previa.
        builder.HasData(
            new
            {
                Id = 1,
                Nombre = "San Patricio",
                Direccion = "Avenida Aconquija 631, Marcos Paz, Yerba Buena, Tucumán",
                Latitud = -26.8158608,
                Longitud = -65.2742406,
                Activo = true
            },
            new
            {
                Id = 2,
                Nombre = "Boisdron",
                Direccion = "General Lamadrid 1048, Marcos Paz, Yerba Buena, Tucumán",
                Latitud = -26.8225289,
                Longitud = -65.2860859,
                Activo = true
            }
        );
    }
}
