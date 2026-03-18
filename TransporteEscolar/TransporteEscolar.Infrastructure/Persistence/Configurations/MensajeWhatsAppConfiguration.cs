using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class MensajeWhatsAppConfiguration : IEntityTypeConfiguration<MensajeWhatsApp>
{
    public void Configure(EntityTypeBuilder<MensajeWhatsApp> builder)
    {
        builder.ToTable("MensajesWhatsApp");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .ValueGeneratedOnAdd();

        builder.Property(m => m.LoteId)
            .IsRequired();

        builder.Property(m => m.TitularId)
            .IsRequired();

        builder.Property(m => m.TelefonoDestino)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(m => m.NombreTitular)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(m => m.ProviderMessageId)
            .IsRequired(false)
            .HasMaxLength(100);

        builder.Property(m => m.DetalleError)
            .IsRequired(false)
            .HasMaxLength(1000);

        builder.Property(m => m.Intentos)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(m => m.FechaCreacion)
            .IsRequired();

        builder.Property(m => m.FechaActualizacion)
            .IsRequired();

        // Relación con Titular (sin cascade delete, los mensajes son histórico)
        builder.HasOne(m => m.Titular)
            .WithMany()
            .HasForeignKey(m => m.TitularId)
            .OnDelete(DeleteBehavior.Restrict);

        // Índices para queries frecuentes
        builder.HasIndex(m => m.LoteId);
        builder.HasIndex(m => m.Estado);
        builder.HasIndex(m => m.TitularId);
        builder.HasIndex(m => m.ProviderMessageId);  // Para lookups desde webhook
    }
}
