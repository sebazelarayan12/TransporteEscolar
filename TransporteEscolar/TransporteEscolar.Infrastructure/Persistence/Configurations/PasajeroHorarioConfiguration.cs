using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class PasajeroHorarioConfiguration : IEntityTypeConfiguration<PasajeroHorario>
{
    public void Configure(EntityTypeBuilder<PasajeroHorario> builder)
    {
        builder.ToTable("PasajeroHorarios");

        builder.HasKey(ph => ph.Id);

        builder.Property(ph => ph.Id)
            .ValueGeneratedOnAdd();

        builder.Property(ph => ph.PasajeroId)
            .IsRequired();

        builder.Property(ph => ph.HorarioId)
            .IsRequired();

        builder.Property(ph => ph.EsPrincipal)
            .IsRequired();

        builder.Property(ph => ph.Prioridad)
            .IsRequired();

        builder.Property(ph => ph.FechaAsignacion)
            .IsRequired();

        builder.HasIndex(ph => new { ph.PasajeroId, ph.HorarioId })
            .IsUnique();

        builder.HasOne(ph => ph.Pasajero)
            .WithMany(p => p.PasajeroHorarios)
            .HasForeignKey(ph => ph.PasajeroId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ph => ph.Horario)
            .WithMany(h => h.PasajeroHorarios)
            .HasForeignKey(ph => ph.HorarioId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
