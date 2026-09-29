using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
public DbSet<Account> Accounts => Set<Account>();
public DbSet<Category> Categories => Set<Category>();
public DbSet<Transaction> Transactions => Set<Transaction>();

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<User>(e =>
    {
        e.Property(u => u.FullName).HasMaxLength(100).IsRequired();
        e.Property(u => u.Email).HasMaxLength(256).IsRequired();
        e.HasIndex(u => u.Email).IsUnique();
        e.Property(u => u.PasswordHash).IsRequired();
    });

    modelBuilder.Entity<Account>(e =>
    {
        e.Property(a => a.Name).HasMaxLength(100).IsRequired();
        e.Property(a => a.Type).HasConversion<string>().HasMaxLength(20);
        e.Property(a => a.Balance).HasPrecision(18, 2);
        e.Property(a => a.Currency).HasMaxLength(3);
        e.HasOne(a => a.User)
         .WithMany(u => u.Accounts)
         .HasForeignKey(a => a.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Category>(e =>
    {
        e.Property(c => c.Name).HasMaxLength(50).IsRequired();
        e.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
    });

    modelBuilder.Entity<Transaction>(e =>
    {
        e.Property(t => t.Type).HasConversion<string>().HasMaxLength(20);
        e.Property(t => t.Amount).HasPrecision(18, 2);
        e.Property(t => t.Description).HasMaxLength(250);
        e.HasIndex(t => new { t.AccountId, t.Date });
        e.HasOne(t => t.Account)
         .WithMany(a => a.Transactions)
         .HasForeignKey(t => t.AccountId)
         .OnDelete(DeleteBehavior.Restrict);
        e.HasOne(t => t.Category)
         .WithMany()
         .HasForeignKey(t => t.CategoryId)
         .OnDelete(DeleteBehavior.SetNull);
    });

    modelBuilder.Entity<Category>().HasData(
    new Category { Id = 1, Name = "Salary", Type = CategoryType.Income },
    new Category { Id = 2, Name = "Other Income", Type = CategoryType.Income },
    new Category { Id = 3, Name = "Food", Type = CategoryType.Expense },
    new Category { Id = 4, Name = "Transport", Type = CategoryType.Expense },
    new Category { Id = 5, Name = "Bills", Type = CategoryType.Expense },
    new Category { Id = 6, Name = "Shopping", Type = CategoryType.Expense }
);
}
}