using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NextStep.Application.DTOs.Contents;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Application.Interfaces.Services;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Services;

public class ContentService : IContentService
{
    private readonly IContentRepository _contentRepository;
    private readonly ILogger<ContentService> _logger;

    public ContentService(
        IContentRepository contentRepository,
        ILogger<ContentService> logger)
    {
        _contentRepository = contentRepository;
        _logger = logger;
    }

    public async Task<ContentDto> SubmitCaseStudyAsync(SubmitCaseStudyRequest request, Guid authorId, UserRole authorRole)
    {
        var content = new Content
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Subtitle = request.Subtitle,
            Description = request.Content,
            Type = ContentType.CaseStudy,
            CategoryId = request.CategoryId,
            ImageUrl = request.ImageUrl,
            AuthorId = authorId,
            Status = ContentStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _contentRepository.AddAsync(content);
        return MapToDto(content);
    }

    public async Task<IEnumerable<ContentDto>> GetPendingCaseStudiesAsync()
    {
        var contents = await _contentRepository.GetByStatusAsync(ContentStatus.Pending);
        return contents.Select(MapToDto);
    }

    public async Task<bool> ApproveCaseStudyAsync(Guid id)
    {
        var content = await _contentRepository.GetByIdAsync(id);
        if (content == null) return false;

        content.Status = ContentStatus.Approved;
        content.UpdatedAt = DateTime.UtcNow;
        await _contentRepository.UpdateAsync(content);
        return true;
    }

    public async Task<bool> RejectCaseStudyAsync(Guid id)
    {
        var content = await _contentRepository.GetByIdAsync(id);
        if (content == null) return false;

        content.Status = ContentStatus.Rejected;
        content.UpdatedAt = DateTime.UtcNow;
        await _contentRepository.UpdateAsync(content);
        return true;
    }

    public async Task<IEnumerable<ContentDto>> GetCaseStudiesByAuthorAsync(Guid authorId)
    {
        var contents = await _contentRepository.GetByAuthorAsync(authorId);
        return contents.Select(MapToDto);
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
