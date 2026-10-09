using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NextStep.Domain.Entities;

namespace NextStep.Application.Interfaces.Repositories;

public interface IContentRepository : IRepository<Content>
{
    Task<IEnumerable<Content>> GetByCategoryAsync(Guid categoryId);
    Task<IEnumerable<Content>> GetByTypeAsync(ContentType type);
    Task<IEnumerable<Content>> GetByStatusAsync(ContentStatus status);
    Task<IEnumerable<Content>> GetByAuthorAsync(Guid authorId);
}
