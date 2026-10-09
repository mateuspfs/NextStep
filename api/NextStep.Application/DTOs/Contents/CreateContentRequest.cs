using System.ComponentModel.DataAnnotations;
using NextStep.Domain.Entities;

namespace NextStep.Application.DTOs.Contents;

public class CreateContentRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(300)]
    public string Subtitle { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public ContentType Type { get; set; }

    [Required]
    public Guid CategoryId { get; set; }

    public string? ImageUrl { get; set; }
}
