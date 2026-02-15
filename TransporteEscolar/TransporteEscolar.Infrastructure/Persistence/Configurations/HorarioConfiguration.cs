using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class HorarioConfiguration : IEntityTypeConfiguration<Horario>
{
    public void Configure(EntityTypeBuilder<Horario> builder)
    {
        builder.ToTable("Horarios");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.Id)
            .ValueGeneratedOnAdd();

        builder.Property(h => h.Etiqueta)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(h => h.Orden)
            .IsRequired();

        builder.HasMany(h => h.Pasajeros)
            .WithOne(p => p.Horario)
            .HasForeignKey(p => p.HorarioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasData(
            new { Id = 1, Etiqueta = "8 San Patricio", Orden = 1 },
            new { Id = 2, Etiqueta = "8 Boisdron", Orden = 2 },
            new { Id = 3, Etiqueta = "9 Boisdron", Orden = 3 },
            new { Id = 4, Etiqueta = "9 San Patricio", Orden = 4 },
            new { Id = 5, Etiqueta = "12 San Patricio", Orden = 5 },
            new { Id = 6, Etiqueta = "13 Boisdron Entrada", Orden = 6 },
            new { Id = 7, Etiqueta = "13 Boisdron Salida", Orden = 7 },
            new { Id = 8, Etiqueta = "16 San Patricio", Orden = 8 },
            new { Id = 9, Etiqueta = "17 Boisdron", Orden = 9 }
        );
    }
}
