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

        builder.Property(m => m.OrigenMensajeId)
            .IsRequired(false)
            .HasMaxLength(200);

        builder.Property(m => m.GrupoId)
            .IsRequired(false);

        builder.Property(m => m.FechaCreacion)
            .IsRequired(false)
            .HasColumnType("timestamp with time zone");

        // �ndices para consultas frecuentes
        builder.HasIndex(m => m.FechaPago);
        builder.HasIndex(m => m.PagoMensualId);

        // Idempotencia del bot: un mismo mensaje no crea dos movimientos para el mismo pago.
        // PostgreSQL no cuenta los NULL como duplicados, asi que los movimientos manuales no chocan.
        builder.HasIndex(m => new { m.OrigenMensajeId, m.PagoMensualId })
            .IsUnique();

        builder.HasIndex(m => m.GrupoId);
    }
}
