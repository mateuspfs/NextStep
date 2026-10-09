using System.ComponentModel.DataAnnotations;
using NextStep.Domain.Entities;

namespace NextStep.Application.DTOs.Auth;

public class CreateUserRequest
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    [Required]
    public UserRole Role { get; set; }
}
