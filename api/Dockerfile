# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for better layer caching
COPY NextStep.sln ./
COPY NextStep.Domain/NextStep.Domain.csproj NextStep.Domain/
COPY NextStep.Application/NextStep.Application.csproj NextStep.Application/
COPY NextStep.Infrastructure/NextStep.Infrastructure.csproj NextStep.Infrastructure/
COPY NextStep.API/NextStep.API.csproj NextStep.API/

# Restore dependencies
RUN dotnet restore

# Copy remaining source code
COPY . .

# Build and publish
WORKDIR /src/NextStep.API
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copy published application
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "NextStep.API.dll"]
