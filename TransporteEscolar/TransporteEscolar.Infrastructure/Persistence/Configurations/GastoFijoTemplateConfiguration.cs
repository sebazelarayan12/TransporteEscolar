using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class GastoFijoTemplateConfiguration : IEntityTypeConfiguration<GastoFijoTemplate>
{
    public void Configure(EntityTypeBuilder<GastoFijoTemplate> builder)
    {
        builder.ToTable("GastosFijosTemplates");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Categoria)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(g => g.Descripcion)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(g => g.Monto)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(g => g.DiaDeAplicacion)
            .IsRequired();

        builder.Property(g => g.MedioPago)
            .IsRequired()
            .HasMaxLength(80);

        builder.Property(g => g.EstaActivo)
            .HasDefaultValue(true);

        builder.Property(g => g.FechaInicio)
            .IsRequired();

        builder.HasMany(g => g.GastosGenerados)
            .WithOne(gm => gm.GastoFijoTemplate)
            .HasForeignKey(gm => gm.GastoFijoTemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(g => new { g.EstaActivo, g.FechaInicio });
    }
}
