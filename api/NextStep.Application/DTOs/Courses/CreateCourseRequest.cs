using System.ComponentModel.DataAnnotations;
using NextStep.Domain.Entities;

namespace NextStep.Application.DTOs.Courses;

public class CreateCourseRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? ThumbnailUrl { get; set; }

    [Required]
    public int TotalLessons { get; set; }

    [Required]
    public int TotalXp { get; set; }

    [Required]
    public TechnicalLevel Level { get; set; }

    [Required]
    public Guid CategoryId { get; set; }
}
