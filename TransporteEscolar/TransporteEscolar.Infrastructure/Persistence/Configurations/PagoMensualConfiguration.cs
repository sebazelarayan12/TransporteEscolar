using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class PagoMensualConfiguration : IEntityTypeConfiguration<PagoMensual>
{
    public void Configure(EntityTypeBuilder<PagoMensual> builder)
    {
        builder.ToTable("PagosMensuales");

        builder.HasKey(pm => pm.Id);

        builder.Property(pm => pm.Id)
            .ValueGeneratedOnAdd();

        builder.Property(pm => pm.TitularId)
            .IsRequired();

        builder.Property(pm => pm.Mes)
            .IsRequired();

        builder.Property(pm => pm.Anio)
            .IsRequired();

        builder.Property(pm => pm.MontoGenerado)
            .IsRequired()
            .HasColumnType("decimal(12,2)");

        builder.Property(pm => pm.FechaVencimiento)
            .IsRequired();

        builder.Property(pm => pm.Observaciones)
            .IsRequired(false)
            .HasMaxLength(500);

        // Relaci�n con Titular
        builder.HasOne(pm => pm.Titular)
            .WithMany()
            .HasForeignKey(pm => pm.TitularId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relaci�n con Movimientos
        builder.HasMany(pm => pm.Movimientos)
            .WithOne(m => m.PagoMensual)
            .HasForeignKey(m => m.PagoMensualId)
            .OnDelete(DeleteBehavior.Cascade);

        // �ndice �nico: TitularId + Mes + Anio
        builder.HasIndex(pm => new { pm.TitularId, pm.Mes, pm.Anio })
            .IsUnique();

        // Nota: Los m�todos TotalPagado(), EstaPagado(), etc. son ignorados autom�ticamente por EF Core
    }
}
