using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Badges;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BadgesController : ControllerBase
{
    private readonly IBadgeService _badgeService;
    private readonly IBadgeRepository _badgeRepository;

    public BadgesController(IBadgeService badgeService, IBadgeRepository badgeRepository)
    {
        _badgeService = badgeService;
        _badgeRepository = badgeRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<BadgeDto>>> GetAll()
    {
        var badges = await _badgeService.GetAllAsync();
        return Ok(badges);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BadgeDto>> Create([FromBody] UpsertBadgeRequest request)
    {
        var defaultSql = @"SELECT u.""Id"" FROM ""Users"" u LEFT JOIN ""UserStats"" s ON s.""UserId"" = u.""Id"" WHERE u.""Role"" = 0 AND (u.""NexPoints"" >= @RequiredPoints OR COALESCE(s.""TotalXp"", 0) >= @RequiredPoints) AND NOT EXISTS (SELECT 1 FROM ""UserBadges"" ub WHERE ub.""UserId"" = u.""Id"" AND ub.""BadgeId"" = @BadgeId)";

        var badge = new Badge
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            IconUrl = string.IsNullOrWhiteSpace(request.IconUrl) ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" : request.IconUrl.Trim(),
            Rarity = (BadgeRarity)request.Rarity,
            RequiredPoints = request.RequiredPoints,
            Criteria = string.IsNullOrWhiteSpace(request.Criteria) ? defaultSql : request.Criteria.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _badgeRepository.AddAsync(badge);

        return Ok(new BadgeDto
        {
            Id = badge.Id,
            Name = badge.Name,
            Description = badge.Description,
            IconUrl = badge.IconUrl,
            Rarity = badge.Rarity,
            RequiredPoints = badge.RequiredPoints,
            Criteria = badge.Criteria,
            IsActive = badge.IsActive,
            CreatedAt = badge.CreatedAt
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BadgeDto>> Update(Guid id, [FromBody] UpsertBadgeRequest request)
    {
        var badge = await _badgeRepository.GetByIdAsync(id);
        if (badge == null) return NotFound();

        badge.Name = request.Name.Trim();
        badge.Description = request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.IconUrl)) badge.IconUrl = request.IconUrl.Trim();
        badge.Rarity = (BadgeRarity)request.Rarity;
        badge.RequiredPoints = request.RequiredPoints;
        if (!string.IsNullOrWhiteSpace(request.Criteria)) badge.Criteria = request.Criteria.Trim();

        await _badgeRepository.UpdateAsync(badge);

        return Ok(new BadgeDto
        {
            Id = badge.Id,
            Name = badge.Name,
            Description = badge.Description,
            IconUrl = badge.IconUrl,
            Rarity = badge.Rarity,
            RequiredPoints = badge.RequiredPoints,
            Criteria = badge.Criteria,
            IsActive = badge.IsActive,
            CreatedAt = badge.CreatedAt
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var badge = await _badgeRepository.GetByIdAsync(id);
        if (badge == null) return NotFound();

        await _badgeRepository.DeleteAsync(badge);
        return NoContent();
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
        var awarded = await _badgeService.CheckAndAwardBadgesDetailedAsync(userId);
        return Ok(new
        {
            awarded = awarded.Count > 0,
            count = awarded.Count,
            badges = awarded,
            message = awarded.Count > 0 ? $"{awarded.Count} novo(s) emblema(s) desbloqueado(s)!" : "Nenhum novo emblema desbloqueado no momento."
        });
    }

    [HttpGet("notifications/{userId:guid}")]
    public async Task<IActionResult> GetUnreadBadgeNotifications(Guid userId)
    {
        var unreadBadges = await _badgeService.ConsumeUnreadBadgeNotificationsAsync(userId);
        return Ok(new
        {
            count = unreadBadges.Count,
            badges = unreadBadges
        });
    }

    [HttpPost("run-worker")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RunWorkerNow()
    {
        var awardedCount = await _badgeService.EvaluateAllBadgesReportsAsync();
        return Ok(new
        {
            awardedCount,
            message = awardedCount > 0
                ? $"Worker executou todas as queries de relatório e atribuiu {awardedCount} novo(s) emblema(s)!"
                : "Worker executou todas as queries de relatório cadastradas. Nenhum novo usuário elegível pendente no momento."
        });
    }
}

public class AwardBadgeRequest
{
    public Guid UserId { get; set; }
    public Guid BadgeId { get; set; }
}

public class UpsertBadgeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int Rarity { get; set; }
    public int RequiredPoints { get; set; }
    public string? Criteria { get; set; }
}
