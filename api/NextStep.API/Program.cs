using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Infrastructure.Data;
using NextStep.Infrastructure.Data.Seeders;
using NextStep.Infrastructure.Repositories;
using NextStep.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Database
var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
var connectionString = NormalizeMySqlConnectionString(rawConnectionString);
builder.Services.AddDbContext<NextStepDbContext>(options =>
    options
        .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
        .UseMySql(
            connectionString,
            new MySqlServerVersion(new Version(8, 0, 36)),
            mySqlOptions => mySqlOptions.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null)));

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
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<NextStepDbContext>();
    await DbSeeder.SeedAsync(context);
    app.Logger.LogInformation("Banco de dados RDS MySQL inicializado e populado com sucesso!");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Falha ao migrar/popular o banco na inicialização.");
}

app.Run();

static string NormalizeMySqlConnectionString(string connStr)
{
    if (string.IsNullOrWhiteSpace(connStr))
    {
        return connStr;
    }

    var parts = connStr.Split(';', StringSplitOptions.RemoveEmptyEntries);
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

        if (key.Equals("Server", StringComparison.OrdinalIgnoreCase) ||
            key.Equals("Host", StringComparison.OrdinalIgnoreCase))
        {
            var hostParts = value.Split(':', 2);
            if (hostParts.Length == 2 && int.TryParse(hostParts[1], out _))
            {
                value = hostParts[0];
                extractedPort = hostParts[1];
            }
        }
        else if (key.Equals("Database", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(value))
        {
            value = "nextstep";
        }
        else if ((key.Equals("User", StringComparison.OrdinalIgnoreCase) || key.Equals("Uid", StringComparison.OrdinalIgnoreCase)) && string.IsNullOrWhiteSpace(value))
        {
            value = "admin";
        }
        else if (key.Equals("Port", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(value))
        {
            value = extractedPort ?? "3306";
        }

        normalized.Add($"{key}={value}");
    }

    return string.Join(";", normalized) + ";";
}
