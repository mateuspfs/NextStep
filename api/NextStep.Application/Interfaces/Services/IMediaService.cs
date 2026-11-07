namespace NextStep.Application.Interfaces.Services;

public interface IMediaService
{
    Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
}
