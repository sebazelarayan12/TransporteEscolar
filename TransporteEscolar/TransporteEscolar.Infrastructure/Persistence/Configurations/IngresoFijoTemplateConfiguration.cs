using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class IngresoFijoTemplateConfiguration : IEntityTypeConfiguration<IngresoFijoTemplate>
{
    public void Configure(EntityTypeBuilder<IngresoFijoTemplate> builder)
    {
        builder.ToTable("IngresosFijosTemplates");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Categoria)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(i => i.Descripcion)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(i => i.Monto)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(i => i.DiaDeAplicacion)
            .IsRequired();

        builder.Property(i => i.MedioCobro)
            .IsRequired()
            .HasMaxLength(80);

        builder.Property(i => i.Observaciones)
            .HasMaxLength(500);

        builder.Property(i => i.FechaInicio)
            .IsRequired();

        builder.Property(i => i.EstaActivo)
            .HasDefaultValue(true);

        builder.HasMany(i => i.IngresosGenerados)
            .WithOne(m => m.IngresoFijoTemplate)
            .HasForeignKey(m => m.IngresoFijoTemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => new { i.EstaActivo, i.FechaInicio });
    }
}
