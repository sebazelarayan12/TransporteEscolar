using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class GastoMensualConfiguration : IEntityTypeConfiguration<GastoMensual>
{
    public void Configure(EntityTypeBuilder<GastoMensual> builder)
    {
        builder.ToTable("GastosMensuales");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Categoria)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(g => g.Descripcion)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(g => g.Monto)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(g => g.MedioPago)
            .IsRequired()
            .HasMaxLength(80);

        builder.Property(g => g.EstadoPago)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(g => g.Observaciones)
            .HasMaxLength(500);

        builder.Property(g => g.Tipo)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(g => g.Fecha)
            .IsRequired();

        builder.HasIndex(g => new { g.Mes, g.Anio });
        builder.HasIndex(g => g.GastoFijoTemplateId);

        builder.HasOne(g => g.GastoFijoTemplate)
            .WithMany(t => t.GastosGenerados)
            .HasForeignKey(g => g.GastoFijoTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
