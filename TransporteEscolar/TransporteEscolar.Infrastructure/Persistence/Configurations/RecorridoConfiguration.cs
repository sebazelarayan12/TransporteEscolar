using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class RecorridoConfiguration : IEntityTypeConfiguration<Recorrido>
{
    public void Configure(EntityTypeBuilder<Recorrido> builder)
    {
        builder.ToTable("Recorridos");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .ValueGeneratedOnAdd();

        builder.Property(r => r.TitularId).IsRequired();
        builder.Property(r => r.ColegioId).IsRequired();
        builder.Property(r => r.DistanciaMetros).IsRequired();
        builder.Property(r => r.DuracionSegundos).IsRequired();

        builder.Property(r => r.GeometriaPolyline)
            .HasMaxLength(20000);

        builder.Property(r => r.Proveedor)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.HashOrigenDestino)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(r => r.FechaCalculo).IsRequired();

        // Un único recorrido por par titular/colegio.
        builder.HasIndex(r => new { r.TitularId, r.ColegioId })
            .IsUnique();

        builder.HasOne<Titular>()
            .WithMany()
            .HasForeignKey(r => r.TitularId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Colegio)
            .WithMany()
            .HasForeignKey(r => r.ColegioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
