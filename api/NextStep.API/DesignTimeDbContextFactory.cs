using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using NextStep.Infrastructure.Data;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace NextStep.API;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<NextStepDbContext>
{
    public NextStepDbContext CreateDbContext(string[] args)
    {
        // Use environment variable or default connection string
        var connectionString = Environment.GetEnvironmentVariable("NEXTCONNSTR")
            ?? "Server=localhost;Database=nextstep;User=root;Password=root;";

        var optionsBuilder = new DbContextOptionsBuilder<NextStepDbContext>();
        
        // Use fixed MySQL version instead of AutoDetect to avoid connection during design-time
        optionsBuilder.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 21)));

        return new NextStepDbContext(optionsBuilder.Options);
    }
}
