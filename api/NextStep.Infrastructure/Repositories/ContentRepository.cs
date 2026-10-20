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

    public override async Task<IEnumerable<Content>> GetAllAsync()
    {
        return await _dbSet
            .Include(c => c.Author)
            .Include(c => c.Category)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Content>> GetByCategoryAsync(Guid categoryId)
    {
        return await _dbSet
            .Include(c => c.Author)
            .Include(c => c.Category)
            .Where(c => c.CategoryId == categoryId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Content>> GetByTypeAsync(ContentType type)
    {
        return await _dbSet
            .Include(c => c.Author)
            .Include(c => c.Category)
            .Where(c => c.Type == type)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
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
