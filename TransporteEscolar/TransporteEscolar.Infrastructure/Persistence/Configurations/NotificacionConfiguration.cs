using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class NotificacionConfiguration : IEntityTypeConfiguration<Notificacion>
{
    public void Configure(EntityTypeBuilder<Notificacion> builder)
    {
        builder.ToTable("Notificaciones");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Id)
            .ValueGeneratedOnAdd();

        builder.Property(n => n.Tipo)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.Titulo)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(n => n.Mensaje)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(n => n.FechaCreacion)
            .IsRequired();

        builder.Property(n => n.Leida)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(n => n.FechaLectura)
            .IsRequired(false);

        builder.Property(n => n.EntidadTipo)
            .IsRequired(false)
            .HasMaxLength(50);

        builder.Property(n => n.EntidadId)
            .IsRequired(false);

        builder.Property(n => n.EsActualizacionProducto)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(n => n.FechaPublicacion)
            .IsRequired(false);

        builder.Property(n => n.Link)
            .IsRequired(false)
            .HasMaxLength(300);

        // Índices para queries frecuentes
        builder.HasIndex(n => n.Leida);
        builder.HasIndex(n => n.FechaCreacion);
        builder.HasIndex(n => new { n.Leida, n.FechaCreacion });
    }
}
