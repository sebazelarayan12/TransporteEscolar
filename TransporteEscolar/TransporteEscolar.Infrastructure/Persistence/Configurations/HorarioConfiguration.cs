using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

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

        builder.Property(h => h.ColegioId);

        builder.Property(h => h.Sentido)
            .IsRequired()
            .HasConversion<int>();

        builder.HasOne(h => h.Colegio)
            .WithMany()
            .HasForeignKey(h => h.ColegioId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasData(
            new { Id = 1, Etiqueta = "8 San Patricio", Orden = 1, ColegioId = (int?)1, Sentido = SentidoHorario.Ida },
            new { Id = 2, Etiqueta = "8 Boisdron", Orden = 2, ColegioId = (int?)2, Sentido = SentidoHorario.Ida },
            new { Id = 3, Etiqueta = "9 Boisdron", Orden = 3, ColegioId = (int?)2, Sentido = SentidoHorario.Ida },
            new { Id = 4, Etiqueta = "9 San Patricio", Orden = 4, ColegioId = (int?)1, Sentido = SentidoHorario.Ida },
            new { Id = 5, Etiqueta = "12 San Patricio", Orden = 5, ColegioId = (int?)1, Sentido = SentidoHorario.Vuelta },
            new { Id = 6, Etiqueta = "13 Boisdron Entrada", Orden = 6, ColegioId = (int?)2, Sentido = SentidoHorario.Ida },
            new { Id = 7, Etiqueta = "13 Boisdron Salida", Orden = 7, ColegioId = (int?)2, Sentido = SentidoHorario.Vuelta },
            new { Id = 8, Etiqueta = "16 San Patricio", Orden = 8, ColegioId = (int?)1, Sentido = SentidoHorario.Vuelta },
            new { Id = 9, Etiqueta = "17 Boisdron", Orden = 9, ColegioId = (int?)2, Sentido = SentidoHorario.Vuelta }
        );
    }
}
