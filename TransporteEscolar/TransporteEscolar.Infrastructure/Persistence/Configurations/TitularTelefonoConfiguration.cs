using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class TitularTelefonoConfiguration : IEntityTypeConfiguration<TitularTelefono>
{
    public void Configure(EntityTypeBuilder<TitularTelefono> builder)
    {
        builder.ToTable("TitularesTelefonos");

        builder.HasKey(tt => tt.Id);

        builder.Property(tt => tt.Id)
            .ValueGeneratedOnAdd();

        builder.Property(tt => tt.TitularId)
            .IsRequired();

        builder.Property(tt => tt.NumeroE164)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(tt => tt.EsPrincipal)
            .IsRequired();

        builder.Property(tt => tt.FechaAlta)
            .IsRequired();

        builder.Property(tt => tt.FechaBaja)
            .IsRequired(false);

        // Índice único: TitularId + NumeroE164
        builder.HasIndex(tt => new { tt.TitularId, tt.NumeroE164 })
            .IsUnique();
    }
}