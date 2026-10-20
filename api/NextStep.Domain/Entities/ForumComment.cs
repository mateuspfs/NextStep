using System;

namespace NextStep.Domain.Entities;

public class ForumComment
{
    public Guid Id { get; set; }
    public Guid ForumQuestionId { get; set; }
    public ForumQuestion ForumQuestion { get; set; } = null!;
    public string Author { get; set; } = string.Empty;
    public Guid? AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public int Votes { get; set; }
    public bool IsSolution { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
