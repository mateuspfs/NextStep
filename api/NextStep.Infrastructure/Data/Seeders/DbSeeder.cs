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
        try
        {
            _ = await context.Users.AnyAsync();
            return; // Tabela Users já existe!
        }
        catch
        {
            // Tabela Users não existe no schema atual
        }

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
}
