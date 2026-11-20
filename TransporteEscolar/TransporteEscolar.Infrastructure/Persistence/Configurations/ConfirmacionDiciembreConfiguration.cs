using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class ConfirmacionDiciembreConfiguration : IEntityTypeConfiguration<ConfirmacionDiciembre>
{
    public void Configure(EntityTypeBuilder<ConfirmacionDiciembre> builder)
    {
        builder.ToTable("ConfirmacionesDiciembre");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .ValueGeneratedOnAdd();

        builder.Property(c => c.TitularId)
            .IsRequired();

        builder.Property(c => c.Anio)
            .IsRequired();

        builder.Property(c => c.Va)
            .IsRequired();

        builder.Property(c => c.Monto)
            .IsRequired(false)
            .HasColumnType("decimal(12,2)");

        builder.Property(c => c.PagoMensualId)
            .IsRequired(false);

        builder.Property(c => c.FechaDecision)
            .IsRequired();

        // Al dar de baja un titular se borra su confirmación junto con él.
        builder.HasOne(c => c.Titular)
            .WithMany()
            .HasForeignKey(c => c.TitularId)
            .OnDelete(DeleteBehavior.Cascade);

        // La baja de titular borra cuotas con ExecuteDelete: la confirmación debe sobrevivir y quedar sin cuota.
        builder.HasOne(c => c.PagoMensual)
            .WithMany()
            .HasForeignKey(c => c.PagoMensualId)
            .OnDelete(DeleteBehavior.SetNull);

        // Una sola decisión por titular y año.
        builder.HasIndex(c => new { c.TitularId, c.Anio })
            .IsUnique();
    }
}
