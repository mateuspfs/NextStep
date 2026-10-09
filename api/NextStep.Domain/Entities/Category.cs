using System;
using System.Collections.Generic;

namespace NextStep.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public ICollection<Content> Contents { get; set; } = new List<Content>();
    public ICollection<Process> Processes { get; set; } = new List<Process>();
}
