using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class TitularConfiguration : IEntityTypeConfiguration<Titular>
{
    public void Configure(EntityTypeBuilder<Titular> builder)
    {
        builder.ToTable("Titulares");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .ValueGeneratedOnAdd(); // SQL Server genera el Id automáticamente

        builder.Property(t => t.Apellido)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.NombreContacto)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Direccion)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(t => t.MontoMensualPactado)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(t => t.FechaAlta)
            .IsRequired();

        builder.Property(t => t.FechaBaja)
            .IsRequired(false); // Nullable

        // Relaciones
        builder.HasMany(t => t.Telefonos)
            .WithOne(tt => tt.Titular)
            .HasForeignKey(tt => tt.TitularId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        builder.HasIndex(t => t.Apellido);
    }
}
