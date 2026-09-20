using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class AporteRepartoConfiguration : IEntityTypeConfiguration<AporteReparto>
{
    public void Configure(EntityTypeBuilder<AporteReparto> builder)
    {
        builder.ToTable("AportesReparto");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();

        builder.Property(a => a.RecorridoHorarioId).IsRequired();
        builder.Property(a => a.TitularId).IsRequired();
        builder.Property(a => a.MetrosAsignados).IsRequired();
        builder.Property(a => a.Orden).IsRequired();
        builder.Property(a => a.MetrosTramoAnterior).IsRequired();

        builder.HasIndex(a => new { a.RecorridoHorarioId, a.TitularId }).IsUnique();

        builder.HasOne<Titular>()
            .WithMany()
            .HasForeignKey(a => a.TitularId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
