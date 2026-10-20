using System;

namespace NextStep.Domain.Entities;

public class ForumQuestionVote
{
    public Guid Id { get; set; }
    public Guid ForumQuestionId { get; set; }
    public ForumQuestion ForumQuestion { get; set; } = null!;
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
