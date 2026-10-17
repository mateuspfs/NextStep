using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Application.DTOs.Contents;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Services;

public interface IContentService
{
    Task<ContentDto> SubmitCaseStudyAsync(SubmitCaseStudyRequest request, Guid authorId, UserRole authorRole);
    Task<IEnumerable<ContentDto>> GetPendingCaseStudiesAsync();
    Task<bool> ApproveCaseStudyAsync(Guid id);
    Task<bool> RejectCaseStudyAsync(Guid id);
    Task<IEnumerable<ContentDto>> GetCaseStudiesByAuthorAsync(Guid authorId);
}
