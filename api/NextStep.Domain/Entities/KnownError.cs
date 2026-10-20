using System;

namespace NextStep.Domain.Entities;

public class KnownError
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "error"; // "error" or "warning"
    public string Category { get; set; } = string.Empty;
    public string Severity { get; set; } = "Crítico"; // "Crítico", "Moderado", "Aviso"
    public string Solution { get; set; } = string.Empty;
    public string StepsToFixJson { get; set; } = "[]";
    public string Source { get; set; } = "Sistema"; // "Sistema" or "Fórum"
    public Guid? RelatedForumId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
