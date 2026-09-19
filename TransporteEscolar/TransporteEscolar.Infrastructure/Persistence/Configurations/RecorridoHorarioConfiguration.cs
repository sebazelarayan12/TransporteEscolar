using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class RecorridoHorarioConfiguration : IEntityTypeConfiguration<RecorridoHorario>
{
    public void Configure(EntityTypeBuilder<RecorridoHorario> builder)
    {
        builder.ToTable("RecorridosHorario");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedOnAdd();

        builder.Property(r => r.HorarioId).IsRequired();
        builder.Property(r => r.Transporte).IsRequired();
        builder.Property(r => r.DistanciaTotalMetros).IsRequired();
        builder.Property(r => r.CantidadParadas).IsRequired();
        builder.Property(r => r.FechaCalculo).IsRequired();

        builder.HasIndex(r => new { r.HorarioId, r.Transporte }).IsUnique();

        builder.HasOne<Horario>()
            .WithMany()
            .HasForeignKey(r => r.HorarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Aportes)
            .WithOne()
            .HasForeignKey(a => a.RecorridoHorarioId)
            .OnDelete(DeleteBehavior.Cascade);

        // La colección se expone como IReadOnlyCollection; EF necesita el campo de respaldo (_aportes).
        builder.Navigation(r => r.Aportes)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
