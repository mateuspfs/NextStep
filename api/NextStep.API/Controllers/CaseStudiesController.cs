using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Contents;
using NextStep.Application.Interfaces.Services;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CaseStudiesController : ControllerBase
{
    private readonly IContentService _contentService;

    public CaseStudiesController(IContentService contentService)
    {
        _contentService = contentService;
    }

    [HttpPost("submit")]
    public async Task<ActionResult<ContentDto>> Submit([FromBody] SubmitCaseStudyRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var content = await _contentService.SubmitCaseStudyAsync(request, Guid.Parse(userId));
        return Ok(content);
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ContentDto>>> GetPending()
    {
        var contents = await _contentService.GetPendingCaseStudiesAsync();
        return Ok(contents);
    }

    [HttpGet("my-submissions")]
    public async Task<ActionResult<IEnumerable<ContentDto>>> GetMySubmissions()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var contents = await _contentService.GetCaseStudiesByAuthorAsync(Guid.Parse(userId));
        return Ok(contents);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var result = await _contentService.ApproveCaseStudyAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Estudo de caso aprovado com sucesso" });
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(Guid id)
    {
        var result = await _contentService.RejectCaseStudyAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Estudo de caso rejeitado" });
    }
}
