using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Badges;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BadgesController : ControllerBase
{
    private readonly IBadgeService _badgeService;

    public BadgesController(IBadgeService badgeService)
    {
        _badgeService = badgeService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<BadgeDto>>> GetAll()
    {
        var badges = await _badgeService.GetAllAsync();
        return Ok(badges);
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<IEnumerable<UserBadgeDto>>> GetUserBadges(Guid userId)
    {
        var badges = await _badgeService.GetUserBadgesAsync(userId);
        return Ok(badges);
    }

    [HttpPost("award")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AwardBadge([FromBody] AwardBadgeRequest request)
    {
        var result = await _badgeService.AwardBadgeAsync(request.UserId, request.BadgeId);
        if (!result) return BadRequest(new { message = "Badge already awarded or not found" });

        return Ok(new { message = "Badge awarded successfully" });
    }

    [HttpPost("check/{userId:guid}")]
    public async Task<IActionResult> CheckAndAwardBadges(Guid userId)
    {
        var result = await _badgeService.CheckAndAwardBadgesAsync(userId);
        return Ok(new { message = result ? "New badges awarded" : "No new badges" });
    }
}

public class AwardBadgeRequest
{
    public Guid UserId { get; set; }
    public Guid BadgeId { get; set; }
}
