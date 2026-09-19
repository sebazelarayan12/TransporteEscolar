using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class AporteMarginalConfiguration : IEntityTypeConfiguration<AporteMarginal>
{
    public void Configure(EntityTypeBuilder<AporteMarginal> builder)
    {
        builder.ToTable("AportesMarginales");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();

        builder.Property(a => a.RecorridoHorarioId).IsRequired();
        builder.Property(a => a.TitularId).IsRequired();
        builder.Property(a => a.MetrosMarginales).IsRequired();

        builder.HasIndex(a => new { a.RecorridoHorarioId, a.TitularId }).IsUnique();

        builder.HasOne<Titular>()
            .WithMany()
            .HasForeignKey(a => a.TitularId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
