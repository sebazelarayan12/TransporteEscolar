using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Infrastructure.Persistence.Configurations;

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.ToTable("PushSubscriptions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Endpoint)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(p => p.P256dh)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(p => p.Auth)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(p => p.UserAgent)
            .HasMaxLength(512);

        builder.HasIndex(p => p.Endpoint)
            .IsUnique();
    }
}
