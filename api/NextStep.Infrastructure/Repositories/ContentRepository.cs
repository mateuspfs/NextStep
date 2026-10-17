using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NextStep.Application.Interfaces.Repositories;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.Infrastructure.Repositories;

public class ContentRepository : Repository<Content>, IContentRepository
{
    public ContentRepository(NextStepDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Content>> GetByCategoryAsync(Guid categoryId)
    {
        return await _dbSet.Where(c => c.CategoryId == categoryId).ToListAsync();
    }

    public async Task<IEnumerable<Content>> GetByTypeAsync(ContentType type)
    {
        return await _dbSet.Where(c => c.Type == type).ToListAsync();
    }

    public async Task<IEnumerable<Content>> GetByStatusAsync(ContentStatus status)
    {
        return await _dbSet
            .Include(c => c.Author)
            .Include(c => c.Category)
            .Where(c => c.Status == status)
            .ToListAsync();
    }

    public async Task<IEnumerable<Content>> GetByAuthorAsync(Guid authorId)
    {
        return await _dbSet.Where(c => c.AuthorId == authorId).ToListAsync();
    }
}
