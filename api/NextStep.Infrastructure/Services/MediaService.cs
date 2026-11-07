using System.Text.RegularExpressions;
using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NextStep.Application.Interfaces.Services;

namespace NextStep.Infrastructure.Services;

public class MediaService : IMediaService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MediaService> _logger;

    public MediaService(IConfiguration configuration, ILogger<MediaService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> UploadImageAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var rawExtension = Path.GetExtension(fileName).ToLowerInvariant();
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"
        };

        var extension = allowedExtensions.Contains(rawExtension) ? rawExtension : ".png";
        var datePrefix = DateTime.UtcNow.ToString("yyyy/MM");
        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var s3Key = $"uploads/images/{datePrefix}/{uniqueFileName}";

        var bucketName = _configuration["AWS:BucketName"]
            ?? Environment.GetEnvironmentVariable("AWS_S3_BUCKET_NAME")
            ?? Environment.GetEnvironmentVariable("S3_BUCKET_NAME")
            ?? "nextstep-frontend-prod-cda235a3";

        var regionName = _configuration["AWS:Region"]
            ?? Environment.GetEnvironmentVariable("AWS_REGION")
            ?? "us-east-1";

        try
        {
            var regionEndpoint = RegionEndpoint.GetBySystemName(regionName) ?? RegionEndpoint.USEast1;
            var accessKey = _configuration["AWS:AccessKey"] ?? Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID");
            var secretKey = _configuration["AWS:SecretKey"] ?? Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY");

            IAmazonS3 s3Client;
            if (!string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey))
            {
                var credentials = new BasicAWSCredentials(accessKey, secretKey);
                s3Client = new AmazonS3Client(credentials, regionEndpoint);
            }
            else
            {
                // Fallback to default AWS SDK credentials chain (~/.aws/credentials, IAM instance profile, etc.)
                s3Client = new AmazonS3Client(regionEndpoint);
            }

            using (s3Client)
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = s3Key,
                    InputStream = fileStream,
                    ContentType = string.IsNullOrWhiteSpace(contentType) ? "image/png" : contentType
                };

                await s3Client.PutObjectAsync(putRequest, cancellationToken);
            }

            var publicUrl = $"https://{bucketName}.s3.{regionName}.amazonaws.com/{s3Key}";
            _logger.LogInformation("Imagem enviada com sucesso para o AWS S3: {Url}", publicUrl);
            return publicUrl;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao enviar imagem para o S3 ({BucketName}). Utilizando armazenamento local como fallback...", bucketName);

            // Local disk fallback
            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var targetDir = Path.Combine(webRoot, "uploads", "images", datePrefix.Replace('/', Path.DirectorySeparatorChar));
            Directory.CreateDirectory(targetDir);

            var localFilePath = Path.Combine(targetDir, uniqueFileName);
            if (fileStream.CanSeek)
            {
                fileStream.Position = 0;
            }

            using (var localStream = new FileStream(localFilePath, FileMode.Create, FileAccess.Write))
            {
                await fileStream.CopyToAsync(localStream, cancellationToken);
            }

            var localUrl = $"/uploads/images/{datePrefix}/{uniqueFileName}";
            _logger.LogInformation("Imagem salva localmente: {LocalUrl}", localUrl);
            return localUrl;
        }
    }
}
