using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class PagoMovimientoConfiguration : IEntityTypeConfiguration<PagoMovimiento>
{
    public void Configure(EntityTypeBuilder<PagoMovimiento> builder)
    {
        builder.ToTable("PagosMovimientos");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .ValueGeneratedOnAdd();

        builder.Property(m => m.PagoMensualId)
            .IsRequired();

        builder.Property(m => m.Monto)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(m => m.FechaPago)
            .IsRequired()
            .HasColumnType("timestamp with time zone");

        builder.Property(m => m.MedioPago)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.Observaciones)
            .IsRequired(false)
            .HasMaxLength(500);

        // �ndices para consultas frecuentes
        builder.HasIndex(m => m.FechaPago);
        builder.HasIndex(m => m.PagoMensualId);
    }
}
