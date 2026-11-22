using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using NextStep.Infrastructure.Data;

namespace NextStep.API;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<NextStepDbContext>
{
    public NextStepDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("NEXTCONNSTR")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=nextstep;Username=postgres;Password=postgres;";

        var optionsBuilder = new DbContextOptionsBuilder<NextStepDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new NextStepDbContext(optionsBuilder.Options);
    }
}
