using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NextStep.API.Workers;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Infrastructure.Data;
using NextStep.Infrastructure.Data.Seeders;
using NextStep.Infrastructure.Repositories;
using NextStep.Infrastructure.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Database (PostgreSQL)
var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? string.Empty;
var connectionString = NormalizePostgresConnectionString(rawConnectionString);
builder.Services.AddDbContext<NextStepDbContext>(options =>
    options
        .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
        .UseNpgsql(
            connectionString,
            npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null)));

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IContentRepository, ContentRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IUserCourseRepository, UserCourseRepository>();
builder.Services.AddScoped<IBadgeRepository, BadgeRepository>();
builder.Services.AddScoped<IUserBadgeRepository, UserBadgeRepository>();
builder.Services.AddScoped<IRankRepository, RankRepository>();
builder.Services.AddScoped<IUserRankRepository, UserRankRepository>();
builder.Services.AddScoped<IUserStatsRepository, UserStatsRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IBadgeService, BadgeService>();
builder.Services.AddScoped<IRankService, RankService>();
builder.Services.AddScoped<IUserStatsService, UserStatsService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IMediaService, MediaService>();

// Scheduled Background Workers
builder.Services.AddHostedService<BadgeSchedulerWorker>();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = JwtService.ResolveSecretKey(builder.Configuration);
var validIssuer = string.IsNullOrWhiteSpace(jwtSettings["Issuer"]) ? "NextStep" : jwtSettings["Issuer"]!;
var validAudience = string.IsNullOrWhiteSpace(jwtSettings["Audience"]) ? "NextStep" : jwtSettings["Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = validIssuer,
            ValidateAudience = true,
            ValidAudience = validAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<NextStepDbContext>();
    for (int attempt = 1; attempt <= 5; attempt++)
    {
        try
        {
            await context.Database.EnsureCreatedAsync();
            await DbSeeder.SeedDataOnlyAsync(context);
            app.Logger.LogInformation("Banco de dados PostgreSQL inicializado e populado com sucesso na tentativa {Attempt}!", attempt);
            break;
        }
        catch (Exception seedEx)
        {
            app.Logger.LogWarning(seedEx, "Tentativa {Attempt} de inicializar/popular o PostgreSQL falhou. Aguardando 3s...", attempt);
            await Task.Delay(3000);
        }
    }
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Falha ao inicializar/popular o banco PostgreSQL na inicialização.");
}

app.Run();

static string NormalizePostgresConnectionString(string connStr)
{
    if (string.IsNullOrWhiteSpace(connStr))
    {
        return "Host=localhost;Port=5432;Database=nextstep;Username=postgres;Password=postgres;";
    }

    var trimmed = connStr.Trim();

    // Suporta URL no formato do Render / Neon / Supabase: postgres://user:pass@host:5432/dbname
    if (trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(trimmed);
        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
        var db = uri.AbsolutePath.Trim('/');
        var port = uri.Port > 0 ? uri.Port : 5432;
        var isLocal = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || uri.Host == "127.0.0.1";
        var sslPart = isLocal ? "" : "SSL Mode=Require;Trust Server Certificate=true;";

        return $"Host={uri.Host};Port={port};Database={db};Username={user};Password={pass};{sslPart}Pooling=true;";
    }

    // Converte chaves legadas Server/User/Uid para o padrão Npgsql Host/Username
    var parts = trimmed.Split(';', StringSplitOptions.RemoveEmptyEntries);
    var normalized = new List<string>();
    string? extractedPort = null;

    foreach (var part in parts)
    {
        var kv = part.Split('=', 2);
        if (kv.Length != 2)
        {
            normalized.Add(part);
            continue;
        }

        var key = kv[0].Trim();
        var value = kv[1].Trim();

        if (key.Equals("AllowUserVariables", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        if (key.Equals("Server", StringComparison.OrdinalIgnoreCase) ||
            key.Equals("Host", StringComparison.OrdinalIgnoreCase))
        {
            key = "Host";
            var hostParts = value.Split(':', 2);
            if (hostParts.Length == 2 && int.TryParse(hostParts[1], out _))
            {
                value = hostParts[0];
                extractedPort = hostParts[1];
            }
        }
        else if (key.Equals("User", StringComparison.OrdinalIgnoreCase) ||
                 key.Equals("Uid", StringComparison.OrdinalIgnoreCase) ||
                 key.Equals("User Id", StringComparison.OrdinalIgnoreCase))
        {
            key = "Username";
        }
        else if (key.Equals("Port", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(value))
        {
            value = extractedPort ?? "5432";
        }

        normalized.Add($"{key}={value}");
    }

    if (extractedPort != null && !normalized.Any(p => p.StartsWith("Port=", StringComparison.OrdinalIgnoreCase)))
    {
        normalized.Add($"Port={extractedPort}");
    }

    return string.Join(";", normalized) + ";";
}
