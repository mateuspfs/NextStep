using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Stats;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly IUserStatsService _userStatsService;
    private readonly IRankService _rankService;
    private readonly IBadgeService _badgeService;

    public StatsController(
        IUserStatsService userStatsService,
        IRankService rankService,
        IBadgeService badgeService)
    {
        _userStatsService = userStatsService;
        _rankService = rankService;
        _badgeService = badgeService;
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<UserStatsDto>> GetUserStats(Guid userId)
    {
        var stats = await _userStatsService.GetByUserIdAsync(userId);
        if (stats == null) return NotFound();
        return Ok(stats);
    }

    [HttpPost("user/{userId:guid}/add-xp")]
    public async Task<ActionResult<UserStatsDto>> AddXp(Guid userId, [FromBody] AddXpRequest request)
    {
        var stats = await _userStatsService.AddXpAsync(userId, request.Xp);
        await _rankService.UpdateUserRankAsync(userId);
        await _badgeService.CheckAndAwardBadgesAsync(userId);
        var updatedStats = await _userStatsService.GetByUserIdAsync(userId);
        return Ok(updatedStats ?? stats);
    }

    [HttpPost("user/{userId:guid}/complete-course")]
    public async Task<ActionResult<UserStatsDto>> IncrementCoursesCompleted(Guid userId)
    {
        var stats = await _userStatsService.IncrementCoursesCompletedAsync(userId);
        return Ok(stats);
    }

    [HttpPost("user/{userId:guid}/complete-activity")]
    public async Task<ActionResult<UserStatsDto>> IncrementActivitiesCompleted(Guid userId)
    {
        var stats = await _userStatsService.IncrementActivitiesCompletedAsync(userId);
        return Ok(stats);
    }

    [HttpPost("user/{userId:guid}/update-streak")]
    public async Task<ActionResult<UserStatsDto>> UpdateStreak(Guid userId)
    {
        var stats = await _userStatsService.UpdateStreakAsync(userId);
        return Ok(stats);
    }
}

public class AddXpRequest
{
    public int Xp { get; set; }
}
