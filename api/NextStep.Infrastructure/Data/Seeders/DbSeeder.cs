using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Data.Seeders;

public static class DbSeeder
{
    public static async Task SeedAsync(NextStepDbContext context)
    {
        try
        {
            await context.Database.MigrateAsync();
        }
        catch (Exception)
        {
            // Se MigrateAsync falhar (ex: PendingModelChangesWarning no EF Core 9 ou tabela parcial),
            // garantimos a criação do schema no bloco abaixo.
        }

        await EnsureTablesExistAsync(context);
        await SeedDataOnlyAsync(context);
    }

    public static async Task EnsureTablesExistAsync(NextStepDbContext context)
    {
        bool usersExist = false;
        try
        {
            _ = await context.Users.AnyAsync();
            usersExist = true;
        }
        catch
        {
            // Tabela Users não existe no schema atual
        }

        if (!usersExist)
        {
            try
            {
                var databaseCreator = context.Database.GetService<IRelationalDatabaseCreator>();
                await databaseCreator.CreateTablesAsync();
            }
            catch
            {
                await context.Database.EnsureCreatedAsync();
            }
        }

        await EnsureForumAndKnownErrorTablesAsync(context);
    }

    public static async Task EnsureForumAndKnownErrorTablesAsync(NextStepDbContext context)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `ForumQuestions` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `Title` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Author` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
                    `AuthorId` char(36) COLLATE ascii_general_ci NULL,
                    `Tag` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
                    `Votes` int NOT NULL DEFAULT 0,
                    `Views` int NOT NULL DEFAULT 0,
                    `HasBestAnswer` tinyint(1) NOT NULL DEFAULT 0,
                    `IsKnownError` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedAt` datetime(6) NOT NULL,
                    PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `ForumComments` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `ForumQuestionId` char(36) COLLATE ascii_general_ci NOT NULL,
                    `Author` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
                    `AuthorId` char(36) COLLATE ascii_general_ci NULL,
                    `Content` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Votes` int NOT NULL DEFAULT 0,
                    `IsSolution` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedAt` datetime(6) NOT NULL,
                    PRIMARY KEY (`Id`),
                    KEY `IX_ForumComments_ForumQuestionId` (`ForumQuestionId`),
                    CONSTRAINT `FK_ForumComments_ForumQuestions_ForumQuestionId`
                        FOREIGN KEY (`ForumQuestionId`) REFERENCES `ForumQuestions` (`Id`) ON DELETE CASCADE
                ) CHARACTER SET=utf8mb4;");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `ForumQuestionVotes` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `ForumQuestionId` char(36) COLLATE ascii_general_ci NOT NULL,
                    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
                    `CreatedAt` datetime(6) NOT NULL,
                    PRIMARY KEY (`Id`),
                    UNIQUE KEY `IX_ForumQuestionVotes_ForumQuestionId_UserId` (`ForumQuestionId`, `UserId`),
                    CONSTRAINT `FK_ForumQuestionVotes_ForumQuestions_ForumQuestionId`
                        FOREIGN KEY (`ForumQuestionId`) REFERENCES `ForumQuestions` (`Id`) ON DELETE CASCADE
                ) CHARACTER SET=utf8mb4;");

            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS `KnownErrors` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `Title` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Type` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
                    `Category` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
                    `Severity` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `Solution` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `StepsToFixJson` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Source` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
                    `RelatedForumId` char(36) COLLATE ascii_general_ci NULL,
                    `CreatedAt` datetime(6) NOT NULL,
                    PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;");
        }
        catch (Exception)
        {
            // Ignorar caso não seja MySQL ou já exista
        }
    }

    public static async Task SeedDataOnlyAsync(NextStepDbContext context)
    {
        await EnsureTablesExistAsync(context);

        if (!context.Categories.Any())
        {
            await SeedCategories(context);
        }

        if (!context.Users.Any())
        {
            await SeedUsers(context);
        }

        if (!context.Courses.Any())
        {
            await SeedCourses(context);
        }

        if (!context.Badges.Any())
        {
            await SeedBadges(context);
        }

        if (!context.Ranks.Any())
        {
            await SeedRanks(context);
        }

        if (!context.UserStats.Any())
        {
            await SeedUserStats(context);
        }

        if (!context.UserCourses.Any())
        {
            await SeedUserCourses(context);
        }

        if (!context.UserBadges.Any())
        {
            await SeedUserBadges(context);
        }

        if (!context.UserRanks.Any())
        {
            await SeedUserRanks(context);
        }

        if (!context.Contents.Any(c => c.Type == ContentType.CaseStudy))
        {
            await SeedCaseStudies(context);
        }

        if (!context.ForumQuestions.Any())
        {
            await SeedForumAndKnownErrors(context);
        }
    }

    private static async Task SeedCategories(NextStepDbContext context)
    {
        var categories = new List<Category>
        {
            new Category { Id = Guid.NewGuid(), Name = "Editorial", Description = "Conteúdos editoriais e de publicação", CreatedAt = DateTime.UtcNow },
            new Category { Id = Guid.NewGuid(), Name = "Técnico", Description = "Conteúdos técnicos e de desenvolvimento", CreatedAt = DateTime.UtcNow },
            new Category { Id = Guid.NewGuid(), Name = "Segurança", Description = "Conteúdos de segurança da informação", CreatedAt = DateTime.UtcNow },
            new Category { Id = Guid.NewGuid(), Name = "Marketing", Description = "Conteúdos de marketing e growth", CreatedAt = DateTime.UtcNow },
            new Category { Id = Guid.NewGuid(), Name = "Recursos Humanos", Description = "Conteúdos de RH e gestão de pessoas", CreatedAt = DateTime.UtcNow },
        };

        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();
    }

    private static async Task SeedUsers(NextStepDbContext context)
    {
        var passwordService = new Services.PasswordService();
        var users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "Luis Henrique",
                Email = "luis@nextstep.com",
                PasswordHash = passwordService.HashPassword("Admin123!"),
                Role = UserRole.Admin,
                NexPoints = 2400,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "Ana Silva",
                Email = "ana@nextstep.com",
                PasswordHash = passwordService.HashPassword("User123!"),
                Role = UserRole.Common,
                NexPoints = 12400,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "Carlos Mendes",
                Email = "carlos@nextstep.com",
                PasswordHash = passwordService.HashPassword("User123!"),
                Role = UserRole.Common,
                NexPoints = 8500,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "Maria Santos",
                Email = "maria@nextstep.com",
                PasswordHash = passwordService.HashPassword("User123!"),
                Role = UserRole.Common,
                NexPoints = 6200,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                FullName = "Pedro Lima",
                Email = "pedro@nextstep.com",
                PasswordHash = passwordService.HashPassword("User123!"),
                Role = UserRole.Common,
                NexPoints = 4800,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCourses(NextStepDbContext context)
    {
        var categories = await context.Categories.ToListAsync();
        var users = await context.Users.ToListAsync();
        var admin = users.First(u => u.Role == UserRole.Admin);

        var courses = new List<Course>
        {
            new Course
            {
                Id = Guid.NewGuid(),
                Title = "Compliance & Ética 2024",
                Description = "Aprenda sobre compliance, ética corporativa e boas práticas de conduta no ambiente de trabalho.",
                ThumbnailUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop",
                TotalLessons = 15,
                TotalXp = 100,
                Level = TechnicalLevel.Beginner,
                CategoryId = categories.First(c => c.Name == "Recursos Humanos").Id,
                AuthorId = admin.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Course
            {
                Id = Guid.NewGuid(),
                Title = "Escrita Criativa e Tone of Voice",
                Description = "Desenvolva habilidades de escrita criativa e aprenda a aplicar o tone of voice da marca.",
                ThumbnailUrl = "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop",
                TotalLessons = 4,
                TotalXp = 250,
                Level = TechnicalLevel.Advanced,
                CategoryId = categories.First(c => c.Name == "Editorial").Id,
                AuthorId = admin.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Course
            {
                Id = Guid.NewGuid(),
                Title = "Processos Internos de Publicação",
                Description = "Conheça os processos internos de publicação, desde a criação até a aprovação final.",
                ThumbnailUrl = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=200&fit=crop",
                TotalLessons = 10,
                TotalXp = 150,
                Level = TechnicalLevel.Intermediate,
                CategoryId = categories.First(c => c.Name == "Editorial").Id,
                AuthorId = admin.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Course
            {
                Id = Guid.NewGuid(),
                Title = "Segurança da Informação",
                Description = "Aprenda sobre segurança da informação, boas práticas e como proteger dados sensíveis.",
                ThumbnailUrl = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop",
                TotalLessons = 12,
                TotalXp = 200,
                Level = TechnicalLevel.Intermediate,
                CategoryId = categories.First(c => c.Name == "Segurança").Id,
                AuthorId = admin.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Course
            {
                Id = Guid.NewGuid(),
                Title = "Marketing Digital Essencial",
                Description = "Fundamentos de marketing digital, SEO, redes sociais e estratégias de conteúdo.",
                ThumbnailUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
                TotalLessons = 8,
                TotalXp = 180,
                Level = TechnicalLevel.Beginner,
                CategoryId = categories.First(c => c.Name == "Marketing").Id,
                AuthorId = admin.Id,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
        };

        await context.Courses.AddRangeAsync(courses);
        await context.SaveChangesAsync();
    }

    private static async Task SeedBadges(NextStepDbContext context)
    {
        var badges = new List<Badge>
        {
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Primeiro Login",
                Description = "Realizou o primeiro login na plataforma",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/190/190411.png",
                Rarity = BadgeRarity.Common,
                RequiredPoints = 0,
                Criteria = "first_login",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Quiz Master",
                Description = "Completou 10 quizzes com mais de 80% de acerto",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135718.png",
                Rarity = BadgeRarity.Rare,
                RequiredPoints = 500,
                Criteria = "quiz_master",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Colaborador",
                Description = "Contribuiu com 5 conteúdos na base de conhecimento",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135730.png",
                Rarity = BadgeRarity.Rare,
                RequiredPoints = 1000,
                Criteria = "contributor",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Expert",
                Description = "Alcançou 5000 pontos de XP",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135700.png",
                Rarity = BadgeRarity.Epic,
                RequiredPoints = 5000,
                Criteria = "expert",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Lenda",
                Description = "Alcançou 10000 pontos de XP",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135692.png",
                Rarity = BadgeRarity.Legendary,
                RequiredPoints = 10000,
                Criteria = "legend",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Streak de Fogo",
                Description = "Manteve uma sequência de 7 dias consecutivos",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135686.png",
                Rarity = BadgeRarity.Epic,
                RequiredPoints = 700,
                Criteria = "streak_7",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Iniciante Dedicado",
                Description = "Completou o primeiro curso",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135705.png",
                Rarity = BadgeRarity.Common,
                RequiredPoints = 100,
                Criteria = "first_course",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Badge
            {
                Id = Guid.NewGuid(),
                Name = "Estudioso",
                Description = "Completou 5 cursos",
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135712.png",
                Rarity = BadgeRarity.Rare,
                RequiredPoints = 1500,
                Criteria = "five_courses",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
        };

        await context.Badges.AddRangeAsync(badges);
        await context.SaveChangesAsync();
    }

    private static async Task SeedRanks(NextStepDbContext context)
    {
        var ranks = new List<Rank>
        {
            new Rank
            {
                Id = Guid.NewGuid(),
                Name = "Bronze",
                Description = "Nível inicial para novos membros",
                MinPoints = 0,
                MaxPoints = 499,
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135657.png",
                Color = "#CD7F32",
                Position = 1,
                CreatedAt = DateTime.UtcNow
            },
            new Rank
            {
                Id = Guid.NewGuid(),
                Name = "Prata",
                Description = "Membros com experiência moderada",
                MinPoints = 500,
                MaxPoints = 1499,
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135660.png",
                Color = "#C0C0C0",
                Position = 2,
                CreatedAt = DateTime.UtcNow
            },
            new Rank
            {
                Id = Guid.NewGuid(),
                Name = "Ouro",
                Description = "Membros experientes e dedicados",
                MinPoints = 1500,
                MaxPoints = 3499,
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135663.png",
                Color = "#FFD700",
                Position = 3,
                CreatedAt = DateTime.UtcNow
            },
            new Rank
            {
                Id = Guid.NewGuid(),
                Name = "Platina",
                Description = "Membros altamente engajados",
                MinPoints = 3500,
                MaxPoints = 6999,
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135666.png",
                Color = "#E5E4E2",
                Position = 4,
                CreatedAt = DateTime.UtcNow
            },
            new Rank
            {
                Id = Guid.NewGuid(),
                Name = "Diamante",
                Description = "Elite da plataforma",
                MinPoints = 7000,
                MaxPoints = 9999,
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135669.png",
                Color = "#B9F2FF",
                Position = 5,
                CreatedAt = DateTime.UtcNow
            },
            new Rank
            {
                Id = Guid.NewGuid(),
                Name = "Lenda",
                Description = "Os melhores da plataforma",
                MinPoints = 10000,
                MaxPoints = 999999,
                IconUrl = "https://cdn-icons-png.flaticon.com/512/3135/3135672.png",
                Color = "#FF6B6B",
                Position = 6,
                CreatedAt = DateTime.UtcNow
            },
        };

        await context.Ranks.AddRangeAsync(ranks);
        await context.SaveChangesAsync();
    }

    private static async Task SeedUserStats(NextStepDbContext context)
    {
        var users = await context.Users.ToListAsync();
        var stats = new List<UserStats>();

        foreach (var user in users)
        {
            stats.Add(new UserStats
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TotalXp = user.NexPoints,
                CurrentLevel = (user.NexPoints / 100) + 1,
                XpToNextLevel = ((user.NexPoints / 100) + 1) * 100 - user.NexPoints,
                CoursesCompleted = new Random().Next(1, 10),
                ActivitiesCompleted = new Random().Next(5, 30),
                BadgesEarned = new Random().Next(1, 5),
                CurrentStreak = new Random().Next(1, 15),
                LongestStreak = new Random().Next(10, 30),
                LastActivityDate = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            });
        }

        await context.UserStats.AddRangeAsync(stats);
        await context.SaveChangesAsync();
    }

    private static async Task SeedUserCourses(NextStepDbContext context)
    {
        var users = await context.Users.Where(u => u.Role == UserRole.Common).ToListAsync();
        var courses = await context.Courses.ToListAsync();
        var userCourses = new List<UserCourse>();

        foreach (var user in users)
        {
            foreach (var course in courses.Take(3))
            {
                var completedLessons = new Random().Next(0, course.TotalLessons + 1);
                var isCompleted = completedLessons >= course.TotalLessons;

                userCourses.Add(new UserCourse
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    CourseId = course.Id,
                    CompletedLessons = completedLessons,
                    TotalLessons = course.TotalLessons,
                    ProgressPercentage = (int)((double)completedLessons / course.TotalLessons * 100),
                    IsCompleted = isCompleted,
                    XpEarned = isCompleted ? course.TotalXp : 0,
                    CompletedAt = isCompleted ? DateTime.UtcNow.AddDays(-new Random().Next(1, 30)) : null,
                    StartedAt = DateTime.UtcNow.AddDays(-new Random().Next(1, 60)),
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await context.UserCourses.AddRangeAsync(userCourses);
        await context.SaveChangesAsync();
    }

    private static async Task SeedUserBadges(NextStepDbContext context)
    {
        var users = await context.Users.Where(u => u.Role == UserRole.Common).ToListAsync();
        var badges = await context.Badges.ToListAsync();
        var userBadges = new List<UserBadge>();

        foreach (var user in users)
        {
            var userBadgesCount = new Random().Next(1, 4);
            var shuffledBadges = badges.OrderBy(b => Guid.NewGuid()).Take(userBadgesCount);

            foreach (var badge in shuffledBadges)
            {
                userBadges.Add(new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    BadgeId = badge.Id,
                    EarnedAt = DateTime.UtcNow.AddDays(-new Random().Next(1, 30)),
                    IsDisplayed = true
                });
            }
        }

        await context.UserBadges.AddRangeAsync(userBadges);
        await context.SaveChangesAsync();
    }

    private static async Task SeedUserRanks(NextStepDbContext context)
    {
        var users = await context.Users.ToListAsync();
        var ranks = await context.Ranks.ToListAsync();
        var userRanks = new List<UserRank>();

        foreach (var user in users)
        {
            var rank = ranks.FirstOrDefault(r => user.NexPoints >= r.MinPoints && user.NexPoints <= r.MaxPoints) ?? ranks.First();

            userRanks.Add(new UserRank
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                RankId = rank.Id,
                CurrentPoints = user.NexPoints,
                AchievedAt = DateTime.UtcNow.AddDays(-new Random().Next(1, 90)),
                UpdatedAt = DateTime.UtcNow
            });
        }

        await context.UserRanks.AddRangeAsync(userRanks);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCaseStudies(NextStepDbContext context)
    {
        var categories = await context.Categories.ToListAsync();
        var users = await context.Users.ToListAsync();
        if (!categories.Any() || !users.Any()) return;

        var marketingCat = categories.FirstOrDefault(c => c.Name == "Marketing") ?? categories.First();
        var techCat = categories.FirstOrDefault(c => c.Name == "Técnico") ?? categories.First();
        var admin = users.FirstOrDefault(u => u.Role == UserRole.Admin) ?? users.First();
        var common = users.FirstOrDefault(u => u.Role == UserRole.Common) ?? users.First();

        var caseStudies = new List<Content>
        {
            new Content
            {
                Id = Guid.NewGuid(),
                Title = "Reestruturação da Campanha Q4: Superando o Burnout Criativo",
                Subtitle = "Gestão ágil de time criativo em momentos de alta pressão",
                Description = "<p>Durante o quarto trimestre, a equipe de marketing e criação enfrentou um bloqueio severo de entregas devido à sobrecarga de demandas simultâneas.</p><h4>Diagnóstico e Mudança de Rota</h4><p>Em vez de manter sprints tradicionais de 2 semanas, adotamos ciclos diários de sincronização (standups de 10 minutos) e matriz de priorização ICE (Impacto, Confiança e Facilidade).</p><h4>Resultados Obtidos</h4><p>Houve uma redução de 40% no retrabalho e entrega da campanha 4 dias antes do prazo estipulado com engajamento recorde de 28% superior ao Q3.</p>",
                Type = ContentType.CaseStudy,
                CategoryId = marketingCat.Id,
                AuthorId = admin.Id,
                ImageUrl = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop",
                Status = ContentStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                UpdatedAt = DateTime.UtcNow.AddDays(-7)
            },
            new Content
            {
                Id = Guid.NewGuid(),
                Title = "Migração de Servidores: Minimizando o Downtime Crítico",
                Subtitle = "Estratégia de migração zero-downtime com proxy reverso",
                Description = "<p>A migração dos bancos de dados relacionais e clusters de aplicação para a nova infraestrutura em nuvem exigia planejamento milimétrico.</p><h4>Estratégia de Canary e Blue-Green</h4><p>Implementamos balanceadores de carga com tráfego gradual e sincronização contínua com CDC (Change Data Capture) para evitar perda de dados transacionais.</p><h4>Aprendizados Principais</h4><p>Documentamos todos os passos no Guia de Contingência de Infraestrutura e reduzimos a janela de manutenção crítica para apenas 8 minutos.</p>",
                Type = ContentType.CaseStudy,
                CategoryId = techCat.Id,
                AuthorId = common.Id,
                ImageUrl = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop",
                Status = ContentStatus.Approved,
                CreatedAt = DateTime.UtcNow.AddDays(-14),
                UpdatedAt = DateTime.UtcNow.AddDays(-14)
            }
        };

        await context.Contents.AddRangeAsync(caseStudies);
        await context.SaveChangesAsync();
    }

    private static async Task SeedForumAndKnownErrors(NextStepDbContext context)
    {
        var q1Id = Guid.NewGuid();
        var q2Id = Guid.NewGuid();
        var q3Id = Guid.NewGuid();

        var questions = new List<ForumQuestion>
        {
            new ForumQuestion
            {
                Id = q1Id,
                Title = "Como lidar com a latência de webhooks no módulo de pagamentos?",
                Description = "Estamos enfrentando um gargalo quando o ambiente de sandbox tenta se comunicar com a base legada de logística. Alguma sugestão de padrão de fila ou retry assíncrono?",
                Author = "@dev_senior",
                Tag = "Integrações",
                Votes = 14,
                Views = 42,
                HasBestAnswer = true,
                IsKnownError = true,
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                Comments = new List<ForumComment>
                {
                    new ForumComment
                    {
                        Id = Guid.NewGuid(),
                        ForumQuestionId = q1Id,
                        Author = "Rafael Oliveira",
                        Content = "Implementamos uma fila intermediária com RabbitMQ/SQS para responder 200 OK ao gateway em menos de 100ms e processar o legado em background. Resolveu 100% dos timeouts!",
                        Votes = 9,
                        IsSolution = true,
                        CreatedAt = DateTime.UtcNow.AddMinutes(-90)
                    },
                    new ForumComment
                    {
                        Id = Guid.NewGuid(),
                        ForumQuestionId = q1Id,
                        Author = "Fernanda Costa",
                        Content = "Vale também configurar idempotência pela chave do evento (event_id) para evitar duplicidade nas retentativas.",
                        Votes = 4,
                        IsSolution = false,
                        CreatedAt = DateTime.UtcNow.AddMinutes(-45)
                    }
                }
            },
            new ForumQuestion
            {
                Id = q2Id,
                Title = "Dúvida sobre a nova política de reembolso para viagens internacionais",
                Description = "O documento na seção de processos menciona um limite diário em dólares, mas não especifica se taxas de câmbio de cartão corporativo estão inclusas no teto.",
                Author = "@ana_compras",
                Tag = "Recursos Humanos",
                Votes = 8,
                Views = 19,
                HasBestAnswer = false,
                IsKnownError = false,
                CreatedAt = DateTime.UtcNow.AddHours(-5),
                Comments = new List<ForumComment>
                {
                    new ForumComment
                    {
                        Id = Guid.NewGuid(),
                        ForumQuestionId = q2Id,
                        Author = "Juliana Martins (RH)",
                        Content = "O IOF e spread do cartão corporativo são contabilizados à parte pela controladoria! O limite diário considera apenas o valor líquido da despesa na moeda original.",
                        Votes = 5,
                        IsSolution = false,
                        CreatedAt = DateTime.UtcNow.AddHours(-3)
                    }
                }
            },
            new ForumQuestion
            {
                Id = q3Id,
                Title = "Melhor prática para versionamento de artefatos no S3 durante deploy contínuo",
                Description = "Durante o pipeline de CI/CD, alguns clientes ainda recebem bundles antigos em cache. Como invalidar de forma limpa sem impactar a disponibilidade?",
                Author = "@lucas_devops",
                Tag = "Tecnologia & DevOps",
                Votes = 21,
                Views = 67,
                HasBestAnswer = true,
                IsKnownError = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Comments = new List<ForumComment>
                {
                    new ForumComment
                    {
                        Id = Guid.NewGuid(),
                        ForumQuestionId = q3Id,
                        Author = "Carla Mendes",
                        Content = "Configure Cache-Control: no-cache no index.html e hashes imutáveis nos assets JS/CSS do Vite, além de disparar create-invalidation no CloudFront após o sync.",
                        Votes = 12,
                        IsSolution = true,
                        CreatedAt = DateTime.UtcNow.AddHours(-20)
                    }
                }
            }
        };

        await context.ForumQuestions.AddRangeAsync(questions);

        if (!context.KnownErrors.Any())
        {
            var errors = new List<KnownError>
            {
                new KnownError
                {
                    Id = Guid.NewGuid(),
                    Title = "Falha de Sincronização CMS",
                    Description = "Ocorre quando o cache do servidor excede 5GB.",
                    Type = "error",
                    Category = "Infraestrutura",
                    Severity = "Crítico",
                    Solution = "Limpeza forçada do cache de arquivos temporários e purga na CDN.",
                    StepsToFixJson = "[\"Acesse o servidor de aplicação via SSH ou painel administrativo.\",\"Execute o comando de expurgo do cache: npm run cache:clear ou acesse /admin/cache/flush.\",\"Verifique se o volume de disco liberou ao menos 20% do espaço.\",\"Reinicie os workers de sincronização em segundo plano.\"]",
                    Source = "Sistema",
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new KnownError
                {
                    Id = Guid.NewGuid(),
                    Title = "Erro de Formatação PDF",
                    Description = "Imagens em CMYK podem quebrar a exportação.",
                    Type = "warning",
                    Category = "Design & Mídia",
                    Severity = "Aviso",
                    Solution = "Converter perfis de cores das imagens para sRGB antes do upload.",
                    StepsToFixJson = "[\"Abra a imagem no Photoshop, GIMP ou ferramenta de compressão.\",\"Altere o modo de cores de CMYK para RGB (sRGB IEC61966-2.1).\",\"Exporte em formato PNG ou WebP com 72 ou 144 DPI.\",\"Faça novo upload e gere a prévia do PDF.\"]",
                    Source = "Sistema",
                    CreatedAt = DateTime.UtcNow.AddDays(-4)
                },
                new KnownError
                {
                    Id = Guid.NewGuid(),
                    Title = "Timeout na API de Tradução",
                    Description = "Latência alta detectada nos servidores da AWS.",
                    Type = "error",
                    Category = "Integrações",
                    Severity = "Crítico",
                    Solution = "Habilitar retry com exponential backoff e fallback local.",
                    StepsToFixJson = "[\"Aumente o timeout da requisição HTTP de 3s para 8s no arquivo de configuração.\",\"Ative a política de repetição com recuo exponencial (até 3 tentativas).\",\"Defina o cache em memória (Redis) para traduções de termos comuns.\"]",
                    Source = "Sistema",
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new KnownError
                {
                    Id = Guid.NewGuid(),
                    Title = "Latência de Webhooks em Pagamentos",
                    Description = "Falha de comunicação entre sandbox e módulo de logística legado.",
                    Type = "error",
                    Category = "Integrações",
                    Severity = "Crítico",
                    Solution = "Fila assíncrona (RabbitMQ/SQS) desacoplando o recebimento de webhooks do processamento síncrono.",
                    StepsToFixJson = "[\"Receba o webhook e responda com HTTP 200 imediatamente após validar a assinatura.\",\"Publique a mensagem do evento na fila de eventos da aplicação.\",\"Consuma a fila com workers dedicados para persistência no banco legado.\"]",
                    Source = "Fórum",
                    RelatedForumId = q1Id,
                    CreatedAt = DateTime.UtcNow.AddHours(-2)
                }
            };

            await context.KnownErrors.AddRangeAsync(errors);
        }

        await context.SaveChangesAsync();
    }
}
