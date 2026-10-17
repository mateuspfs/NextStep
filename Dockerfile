# Etapa 1: Runtime de Base
ARG DOTNET_VERSION=10.0-preview
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Etapa 2: SDK para Build e Publish
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

# Copiar arquivos de projeto de forma otimizada para cache de camadas
COPY ["api/NextStep.Domain/NextStep.Domain.csproj", "api/NextStep.Domain/"]
COPY ["api/NextStep.Application/NextStep.Application.csproj", "api/NextStep.Application/"]
COPY ["api/NextStep.Infrastructure/NextStep.Infrastructure.csproj", "api/NextStep.Infrastructure/"]
COPY ["api/NextStep.API/NextStep.API.csproj", "api/NextStep.API/"]
COPY ["api/NextStep.sln", "api/"]

# Restaurar dependências da solução NextStep
RUN dotnet restore "api/NextStep.sln"

# Copiar todo o código fonte da API
COPY api/ api/

# Buildar e publicar o projeto NextStep.API
WORKDIR "/src/api/NextStep.API"
RUN dotnet publish "NextStep.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Etapa 3: Imagem Final de Produção (Leve e Segura)
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

# Definir variáveis de ambiente padrão para produção
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "NextStep.API.dll"]
