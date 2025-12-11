namespace NoraxCredentials.Api.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CredentialItem> Credentials => Set<CredentialItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserCredentialAccess> UserCredentialAccesses => Set<UserCredentialAccess>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>()
            .HasMany(c => c.Credentials)
            .WithOne(c => c.Category!)
            .HasForeignKey(c => c.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Name)
            .IsUnique();

        modelBuilder.Entity<CredentialItem>()
            .Property(c => c.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<CredentialItem>()
            .Property(c => c.UpdatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()");

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<UserCredentialAccess>()
            .HasKey(uca => new { uca.UserId, uca.CredentialId });

        modelBuilder.Entity<UserCredentialAccess>()
            .HasOne(uca => uca.User)
            .WithMany(u => u.CredentialAccesses)
            .HasForeignKey(uca => uca.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserCredentialAccess>()
            .HasOne(uca => uca.Credential)
            .WithMany(c => c.CredentialAccesses)
            .HasForeignKey(uca => uca.CredentialId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Category>().HasData(
            new Category
            {
                Id = Guid.Parse("70763946-c3b3-4518-aba0-2d09f5068e17"),
                Name = "Sunucular",
                Description = "RDP, SSH, DB erişimleri",
                SortOrder = 1
            },
            new Category
            {
                Id = Guid.Parse("65f9fbfc-a0d1-4f42-ac9f-f703beb6b624"),
                Name = "Veri Tabanları",
                Description = "SQL, NoSQL ve veri ambarı erişimleri",
                SortOrder = 2
            },
            new Category
            {
                Id = Guid.Parse("1510d449-f3ae-4ec9-97a7-efb4d7741d97"),
                Name = "Dış Uygulamalar",
                Description = "ChatGPT, Exchange, İsimTescil vb.",
                SortOrder = 4
            },
            new Category
            {
                Id = Guid.Parse("5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a"),
                Name = "İç Uygulamalar",
                Description = "Şirket içi yazılımlar ve servis hesapları",
                SortOrder = 3
            }
        );
    }
}
