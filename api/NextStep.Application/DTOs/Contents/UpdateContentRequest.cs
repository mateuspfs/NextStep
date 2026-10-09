using System.ComponentModel.DataAnnotations;
using NextStep.Domain.Entities;

namespace NextStep.Application.DTOs.Contents;

public class UpdateContentRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [StringLength(300)]
    public string? Subtitle { get; set; }

    public string? Description { get; set; }

    public ContentType? Type { get; set; }

    public Guid? CategoryId { get; set; }

    public string? ImageUrl { get; set; }
}
