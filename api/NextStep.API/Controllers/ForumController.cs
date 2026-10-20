using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NextStep.Domain.Entities;
using NextStep.Infrastructure.Data;

namespace NextStep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ForumController : ControllerBase
{
    private readonly NextStepDbContext _context;

    public ForumController(NextStepDbContext context)
    {
        _context = context;
    }

    [HttpGet("questions")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQuestions()
    {
        var userId = GetCurrentUserId();

        var questions = await _context.ForumQuestions
            .Include(q => q.Comments)
            .Include(q => q.UserVotes)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        var response = questions.Select(q => MapQuestion(q, userId)).ToList();
        return Ok(response);
    }

    [HttpPost("questions")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateQuestion([FromBody] CreateForumQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Título e descrição são obrigatórios." });
        }

        var userId = GetCurrentUserId();
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? request.Author ?? "usuario";
        var formattedAuthor = userName.StartsWith("@")
            ? userName
            : $"@{userName.ToLowerInvariant().Replace(" ", "_")}";

        var question = new ForumQuestion
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Author = formattedAuthor,
            AuthorId = userId,
            Tag = string.IsNullOrWhiteSpace(request.Tag) ? "Integrações" : request.Tag.Trim(),
            Votes = 1,
            Views = 1,
            HasBestAnswer = false,
            IsKnownError = request.IsKnownError,
            CreatedAt = DateTime.UtcNow
        };

        if (userId.HasValue)
        {
            question.UserVotes.Add(new ForumQuestionVote
            {
                Id = Guid.NewGuid(),
                ForumQuestionId = question.Id,
                UserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.ForumQuestions.AddAsync(question);

        if (request.IsKnownError)
        {
            var steps = new[]
            {
                "Verifique as respostas recentes na discussão do Fórum.",
                "Valide se o comportamento pode ser reproduzido em ambiente de testes.",
                "Contribua com logs adicionais no tópico correspondente."
            };

            var knownError = new KnownError
            {
                Id = Guid.NewGuid(),
                Title = question.Title,
                Description = question.Description,
                Type = "error",
                Category = question.Tag,
                Severity = "Crítico",
                Solution = "Em investigação colaborativa no Fórum de Dúvidas. Acompanhe as respostas técnicas enviadas pela equipe.",
                StepsToFixJson = JsonSerializer.Serialize(steps),
                Source = "Fórum",
                RelatedForumId = question.Id,
                CreatedAt = DateTime.UtcNow
            };

            await _context.KnownErrors.AddAsync(knownError);
        }

        await _context.SaveChangesAsync();
        return Ok(MapQuestion(question, userId));
    }

    [HttpPost("questions/{id:guid}/vote")]
    [AllowAnonymous]
    public async Task<IActionResult> ToggleVote(Guid id)
    {
        var question = await _context.ForumQuestions
            .Include(q => q.Comments)
            .Include(q => q.UserVotes)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question == null) return NotFound();

        var userId = GetCurrentUserId();
        bool userVoted;

        if (userId.HasValue)
        {
            var existingVote = question.UserVotes.FirstOrDefault(v => v.UserId == userId.Value);
            if (existingVote != null)
            {
                _context.ForumQuestionVotes.Remove(existingVote);
                question.Votes = Math.Max(0, question.Votes - 1);
                userVoted = false;
            }
            else
            {
                var newVote = new ForumQuestionVote
                {
                    Id = Guid.NewGuid(),
                    ForumQuestionId = question.Id,
                    UserId = userId.Value,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.ForumQuestionVotes.AddAsync(newVote);
                question.Votes += 1;
                userVoted = true;
            }
        }
        else
        {
            question.Votes += 1;
            userVoted = true;
        }

        await _context.SaveChangesAsync();
        var dto = MapQuestion(question, userId);
        return Ok(new { question = dto, userVoted });
    }

    [HttpPost("questions/{id:guid}/view")]
    [AllowAnonymous]
    public async Task<IActionResult> IncrementView(Guid id)
    {
        var question = await _context.ForumQuestions
            .Include(q => q.Comments)
            .Include(q => q.UserVotes)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question == null) return NotFound();

        question.Views += 1;
        await _context.SaveChangesAsync();

        var userId = GetCurrentUserId();
        return Ok(MapQuestion(question, userId));
    }

    [HttpPost("questions/{id:guid}/comments")]
    [AllowAnonymous]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CreateForumCommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "O conteúdo da resposta é obrigatório." });
        }

        var question = await _context.ForumQuestions
            .Include(q => q.Comments)
            .Include(q => q.UserVotes)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question == null) return NotFound();

        var userId = GetCurrentUserId();
        var authorName = User.FindFirst(ClaimTypes.Name)?.Value ?? request.Author ?? "Colaborador";

        var comment = new ForumComment
        {
            Id = Guid.NewGuid(),
            ForumQuestionId = question.Id,
            Author = authorName,
            AuthorId = userId,
            Content = request.Content.Trim(),
            Votes = 0,
            IsSolution = request.IsSolution,
            CreatedAt = DateTime.UtcNow
        };

        await _context.ForumComments.AddAsync(comment);
        question.Comments.Add(comment);

        if (request.IsSolution)
        {
            question.HasBestAnswer = true;

            if (question.IsKnownError)
            {
                var relatedError = await _context.KnownErrors
                    .FirstOrDefaultAsync(e => e.RelatedForumId == question.Id || e.Title == question.Title);

                if (relatedError != null)
                {
                    relatedError.Solution = comment.Content;
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(MapQuestion(question, userId));
    }

    [HttpPost("questions/{questionId:guid}/comments/{commentId:guid}/toggle-solution")]
    [AllowAnonymous]
    public async Task<IActionResult> ToggleCommentSolution(Guid questionId, Guid commentId)
    {
        var question = await _context.ForumQuestions
            .Include(q => q.Comments)
            .Include(q => q.UserVotes)
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null) return NotFound();

        var comment = question.Comments.FirstOrDefault(c => c.Id == commentId);
        if (comment == null) return NotFound();

        comment.IsSolution = !comment.IsSolution;
        question.HasBestAnswer = question.Comments.Any(c => c.IsSolution);

        if (question.IsKnownError)
        {
            var relatedError = await _context.KnownErrors
                .FirstOrDefaultAsync(e => e.RelatedForumId == question.Id || e.Title == question.Title);

            if (relatedError != null)
            {
                var bestComment = question.Comments.FirstOrDefault(c => c.IsSolution);
                if (bestComment != null)
                {
                    relatedError.Solution = bestComment.Content;
                }
            }
        }

        await _context.SaveChangesAsync();
        var userId = GetCurrentUserId();
        return Ok(MapQuestion(question, userId));
    }

    [HttpPost("questions/{id:guid}/toggle-known-error")]
    [AllowAnonymous]
    public async Task<IActionResult> ToggleKnownError(Guid id)
    {
        var question = await _context.ForumQuestions
            .Include(q => q.Comments)
            .Include(q => q.UserVotes)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question == null) return NotFound();

        question.IsKnownError = !question.IsKnownError;

        if (question.IsKnownError)
        {
            var exists = await _context.KnownErrors
                .AnyAsync(e => e.RelatedForumId == question.Id || e.Title == question.Title);

            if (!exists)
            {
                var solutionComment = question.Comments.FirstOrDefault(c => c.IsSolution);
                var steps = new[]
                {
                    "Acesse a discussão técnica completa no Fórum.",
                    "Consulte as orientações e respostas validadas pelos especialistas."
                };

                var newError = new KnownError
                {
                    Id = Guid.NewGuid(),
                    Title = question.Title,
                    Description = question.Description,
                    Type = "error",
                    Category = question.Tag,
                    Severity = "Crítico",
                    Solution = solutionComment != null
                        ? solutionComment.Content
                        : "Solução em debate no Fórum de Dúvidas.",
                    StepsToFixJson = JsonSerializer.Serialize(steps),
                    Source = "Fórum",
                    RelatedForumId = question.Id,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.KnownErrors.AddAsync(newError);
            }
        }

        await _context.SaveChangesAsync();
        var userId = GetCurrentUserId();
        return Ok(MapQuestion(question, userId));
    }

    [HttpGet("known-errors")]
    [AllowAnonymous]
    public async Task<IActionResult> GetKnownErrors()
    {
        var errors = await _context.KnownErrors
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        var response = errors.Select(MapKnownError).ToList();
        return Ok(response);
    }

    [HttpPost("known-errors")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateKnownError([FromBody] CreateKnownErrorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description) ||
            string.IsNullOrWhiteSpace(request.Solution))
        {
            return BadRequest(new { message = "Título, descrição e solução são obrigatórios." });
        }

        var type = request.Type == "warning" ? "warning" : "error";
        var severity = type == "error" ? "Crítico" : "Aviso";
        var steps = request.StepsToFix != null && request.StepsToFix.Any()
            ? request.StepsToFix
            : new List<string>
            {
                "Identificar a ocorrência e isolar a causa primária.",
                request.Solution.Trim(),
                "Validar a estabilidade do serviço após aplicação."
            };

        var knownError = new KnownError
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Type = type,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Tecnologia & DevOps" : request.Category.Trim(),
            Severity = severity,
            Solution = request.Solution.Trim(),
            StepsToFixJson = JsonSerializer.Serialize(steps),
            Source = string.IsNullOrWhiteSpace(request.Source) ? "Sistema" : request.Source.Trim(),
            RelatedForumId = request.RelatedForumId,
            CreatedAt = DateTime.UtcNow
        };

        await _context.KnownErrors.AddAsync(knownError);
        await _context.SaveChangesAsync();

        return Ok(MapKnownError(knownError));
    }

    private Guid? GetCurrentUserId()
    {
        var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(raw, out var parsed) ? parsed : null;
    }

    private static object MapQuestion(ForumQuestion q, Guid? currentUserId)
    {
        var orderedComments = q.Comments
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                id = c.Id.ToString(),
                author = c.Author,
                time = FormatRelativeTime(c.CreatedAt),
                content = c.Content,
                votes = c.Votes,
                isSolution = c.IsSolution
            })
            .ToList();

        var userVoted = currentUserId.HasValue && q.UserVotes.Any(v => v.UserId == currentUserId.Value);

        return new
        {
            id = q.Id.ToString(),
            title = q.Title,
            description = q.Description,
            author = q.Author,
            time = FormatRelativeTime(q.CreatedAt),
            votes = q.Votes,
            answers = orderedComments.Count,
            views = q.Views,
            tag = q.Tag,
            hasBestAnswer = q.HasBestAnswer || orderedComments.Any(c => c.isSolution),
            isKnownError = q.IsKnownError,
            userVoted,
            comments = orderedComments
        };
    }

    private static object MapKnownError(KnownError e)
    {
        List<string> steps;
        try
        {
            steps = JsonSerializer.Deserialize<List<string>>(e.StepsToFixJson) ?? new List<string>();
        }
        catch
        {
            steps = new List<string>();
        }

        return new
        {
            id = e.Id.ToString(),
            title = e.Title,
            description = e.Description,
            type = e.Type == "warning" ? "warning" : "error",
            category = e.Category,
            severity = e.Severity,
            solution = e.Solution,
            stepsToFix = steps,
            source = e.Source,
            relatedForumId = e.RelatedForumId?.ToString()
        };
    }

    private static string FormatRelativeTime(DateTime createdAt)
    {
        var diff = DateTime.UtcNow - createdAt;
        if (diff.TotalMinutes < 2) return "Agora mesmo";
        if (diff.TotalMinutes < 60) return $"há {(int)diff.TotalMinutes} min";
        if (diff.TotalHours < 24) return $"há {(int)diff.TotalHours} horas";
        if (diff.TotalDays < 30) return $"há {(int)diff.TotalDays} dias";
        return createdAt.ToString("dd/MM/yyyy");
    }
}

public class CreateForumQuestionRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Tag { get; set; } = string.Empty;
    public string? Author { get; set; }
    public bool IsKnownError { get; set; }
}

public class CreateForumCommentRequest
{
    public string Content { get; set; } = string.Empty;
    public string? Author { get; set; }
    public bool IsSolution { get; set; }
}

public class CreateKnownErrorRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "error";
    public string Category { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;
    public List<string>? StepsToFix { get; set; }
    public string? Source { get; set; }
    public Guid? RelatedForumId { get; set; }
}
