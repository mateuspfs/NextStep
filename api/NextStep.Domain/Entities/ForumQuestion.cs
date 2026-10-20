using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class ForumQuestion
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public Guid? AuthorId { get; set; }
    public string Tag { get; set; } = string.Empty;
    public int Votes { get; set; }
    public int Views { get; set; }
    public bool HasBestAnswer { get; set; }
    public bool IsKnownError { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ForumComment> Comments { get; set; } = new List<ForumComment>();
    public ICollection<ForumQuestionVote> UserVotes { get; set; } = new List<ForumQuestionVote>();
}
