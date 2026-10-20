using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Contents;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CaseStudiesController : ControllerBase
{
    private readonly IContentService _contentService;
    private readonly NextStep.Application.Interfaces.Repositories.IContentRepository _contentRepository;

    public CaseStudiesController(
        IContentService contentService,
        NextStep.Application.Interfaces.Repositories.IContentRepository contentRepository)
    {
        _contentService = contentService;
        _contentRepository = contentRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ContentDto>>> GetAll()
    {
        var contents = await _contentRepository.GetByTypeAsync(ContentType.CaseStudy);
        var dtos = new List<ContentDto>();
        foreach (var content in contents)
        {
            dtos.Add(new ContentDto
            {
                Id = content.Id,
                Title = content.Title,
                Subtitle = content.Subtitle,
                Description = content.Description,
                Type = content.Type,
                CategoryId = content.CategoryId,
                CategoryName = content.Category?.Name ?? "Geral",
                AuthorId = content.AuthorId,
                AuthorName = content.Author?.FullName ?? "Colaborador",
                ImageUrl = content.ImageUrl,
                Status = content.Status,
                CreatedAt = content.CreatedAt,
                UpdatedAt = content.UpdatedAt
            });
        }
        return Ok(dtos);
    }

    [HttpPost("submit")]
    [AllowAnonymous]
    public async Task<ActionResult<ContentDto>> Submit([FromBody] SubmitCaseStudyRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            var allCategories = await _contentRepository.GetAllAsync();
            var fallbackAuthorId = allCategories.FirstOrDefault()?.AuthorId ?? Guid.Empty;
            if (fallbackAuthorId == Guid.Empty) return Unauthorized();
            parsedUserId = fallbackAuthorId;
        }

        var role = userRole == "Admin" ? UserRole.Admin : UserRole.Common;
        var content = await _contentService.SubmitCaseStudyAsync(request, parsedUserId, role);
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
