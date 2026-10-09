using NextStep.Domain.Entities;

namespace NextStep.Application.DTOs.Auth;

public class UserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public UserRole Role { get; set; }
    public int NexPoints { get; set; }
    public DateTime CreatedAt { get; set; }
}
