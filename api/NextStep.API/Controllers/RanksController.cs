using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Leaderboard;
using NextStep.Application.DTOs.Ranks;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RanksController : ControllerBase
{
    private readonly IRankService _rankService;

    public RanksController(IRankService rankService)
    {
        _rankService = rankService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<RankDto>>> GetAll()
    {
        var ranks = await _rankService.GetAllAsync();
        return Ok(ranks);
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<UserRankDto>> GetUserRank(Guid userId)
    {
        var rank = await _rankService.GetUserRankAsync(userId);
        if (rank == null) return NotFound();
        return Ok(rank);
    }

    [HttpPost("update/{userId:guid}")]
    public async Task<IActionResult> UpdateUserRank(Guid userId)
    {
        var result = await _rankService.UpdateUserRankAsync(userId);
        if (!result) return BadRequest(new { message = "Failed to update rank" });

        return Ok(new { message = "Rank updated successfully" });
    }

    [HttpGet("leaderboard")]
    public async Task<ActionResult<IEnumerable<LeaderboardEntryDto>>> GetLeaderboard([FromQuery] int top = 20)
    {
        var leaderboard = await _rankService.GetLeaderboardAsync(top);
        return Ok(leaderboard);
    }
}
