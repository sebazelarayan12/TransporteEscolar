using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class IngresoMensualConfiguration : IEntityTypeConfiguration<IngresoMensual>
{
    public void Configure(EntityTypeBuilder<IngresoMensual> builder)
    {
        builder.ToTable("IngresosMensuales");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Categoria)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(i => i.Descripcion)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(i => i.Monto)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(i => i.MedioCobro)
            .IsRequired()
            .HasMaxLength(80);

        builder.Property(i => i.EstadoCobro)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(i => i.Observaciones)
            .HasMaxLength(500);

        builder.Property(i => i.Tipo)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(i => i.Fecha)
            .IsRequired();

        builder.HasIndex(i => new { i.Mes, i.Anio });
        builder.HasIndex(i => i.IngresoFijoTemplateId);

        builder.HasOne(i => i.IngresoFijoTemplate)
            .WithMany(t => t.IngresosGenerados)
            .HasForeignKey(i => i.IngresoFijoTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
