using System.ComponentModel.DataAnnotations;

namespace NextStep.Application.DTOs.Contents;

public class SubmitCaseStudyRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(300)]
    public string Subtitle { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    public Guid CategoryId { get; set; }

    public string? ImageUrl { get; set; }
}
