using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextStep.Infrastructure.Data;
using NextStep.Infrastructure.Data.Seeders;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly NextStepDbContext _db;

    public HealthController(NextStepDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync();
            if (canConnect)
            {
                try
                {
                    _ = await _db.Users.AnyAsync();
                }
                catch
                {
                    await DbSeeder.SeedAsync(_db);
                }
            }
            var usersCount = canConnect ? await _db.Users.CountAsync() : 0;
            return Ok(new
            {
                status = "healthy",
                databaseConnected = canConnect,
                usersCount,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "unhealthy",
                databaseConnected = false,
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}
