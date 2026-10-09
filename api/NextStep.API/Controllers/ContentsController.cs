using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NextStep.Application.DTOs.Contents;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContentsController : ControllerBase
{
    private readonly IContentRepository _contentRepository;
    private readonly ICategoryRepository _categoryRepository;

    public ContentsController(IContentRepository contentRepository, ICategoryRepository categoryRepository)
    {
        _contentRepository = contentRepository;
        _categoryRepository = categoryRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<ContentDto>>> GetAll()
    {
        var contents = await _contentRepository.GetAllAsync();
        var dtos = new List<ContentDto>();
        foreach (var content in contents)
        {
            dtos.Add(MapToDto(content));
        }
        return Ok(dtos);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ContentDto>> GetById(Guid id)
    {
        var content = await _contentRepository.GetByIdAsync(id);
        if (content == null) return NotFound();
        return Ok(MapToDto(content));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ContentDto>> Create([FromBody] CreateContentRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var content = new Content
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Subtitle = request.Subtitle,
            Description = request.Description,
            Type = request.Type,
            CategoryId = request.CategoryId,
            ImageUrl = request.ImageUrl,
            AuthorId = Guid.Parse(userId),
            Status = ContentStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _contentRepository.AddAsync(content);
        return CreatedAtAction(nameof(GetById), new { id = content.Id }, MapToDto(content));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContentRequest request)
    {
        var content = await _contentRepository.GetByIdAsync(id);
        if (content == null) return NotFound();

        if (request.Title != null) content.Title = request.Title;
        if (request.Subtitle != null) content.Subtitle = request.Subtitle;
        if (request.Description != null) content.Description = request.Description;
        if (request.Type.HasValue) content.Type = request.Type.Value;
        if (request.CategoryId.HasValue) content.CategoryId = request.CategoryId.Value;
        if (request.ImageUrl != null) content.ImageUrl = request.ImageUrl;
        content.UpdatedAt = DateTime.UtcNow;

        await _contentRepository.UpdateAsync(content);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var content = await _contentRepository.GetByIdAsync(id);
        if (content == null) return NotFound();

        await _contentRepository.DeleteAsync(content);
        return NoContent();
    }

    private ContentDto MapToDto(Content content)
    {
        return new ContentDto
        {
            Id = content.Id,
            Title = content.Title,
            Subtitle = content.Subtitle,
            Description = content.Description,
            Type = content.Type,
            CategoryId = content.CategoryId,
            CategoryName = content.Category?.Name ?? string.Empty,
            AuthorId = content.AuthorId,
            AuthorName = content.Author?.FullName ?? string.Empty,
            ImageUrl = content.ImageUrl,
            Status = content.Status,
            CreatedAt = content.CreatedAt,
            UpdatedAt = content.UpdatedAt
        };
    }
}
