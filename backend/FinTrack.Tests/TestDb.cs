using FinTrack.Api.Data;
using FinTrack.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Tests;

public static class TestDb
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // a fresh database for every test
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated(); // applies the seed data, so the categories exist

        db.Users.AddRange(
            new User { Id = 1, FullName = "User One", Email = "one@test.com", PasswordHash = "x" },
            new User { Id = 2, FullName = "User Two", Email = "two@test.com", PasswordHash = "x" });
        db.SaveChanges();

        return db;
    }

    public static Account AddAccount(AppDbContext db, int userId, string name, decimal balance)
    {
        var account = new Account { UserId = userId, Name = name, Type = AccountType.Cash, Balance = balance };
        db.Accounts.Add(account);
        db.SaveChanges();
        return account;
    }
}