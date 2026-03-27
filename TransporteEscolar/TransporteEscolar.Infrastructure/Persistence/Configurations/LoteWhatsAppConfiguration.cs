using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class LoteWhatsAppConfiguration : IEntityTypeConfiguration<LoteWhatsApp>
{
    public void Configure(EntityTypeBuilder<LoteWhatsApp> builder)
    {
        builder.ToTable("LotesWhatsApp");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Id)
            .ValueGeneratedOnAdd();

        builder.Property(l => l.Estado)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(l => l.TipoMensaje)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(l => l.Descripcion)
            .IsRequired(false)
            .HasMaxLength(200);

        builder.Property(l => l.FechaCreacion)
            .IsRequired();

        builder.Property(l => l.FechaFinalizacion)
            .IsRequired(false);

        // Relación: un Lote tiene muchos Mensajes
        builder.HasMany(l => l.Mensajes)
            .WithOne(m => m.Lote)
            .HasForeignKey(m => m.LoteId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        builder.HasIndex(l => l.Estado);
        builder.HasIndex(l => l.FechaCreacion);
    }
}
