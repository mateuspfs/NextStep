using Microsoft.EntityFrameworkCore;
using NextStep.Domain.Entities;

namespace NextStep.Infrastructure.Data;

public class NextStepDbContext : DbContext
{
    public NextStepDbContext(DbContextOptions<NextStepDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Content> Contents { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Process> Processes { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<UserActivity> UserActivities { get; set; }
    public DbSet<LearningLog> LearningLogs { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
    public DbSet<QuizQuestion> QuizQuestions { get; set; }
    public DbSet<QuizOption> QuizOptions { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseLesson> CourseLessons { get; set; }
    public DbSet<UserCourse> UserCourses { get; set; }
    public DbSet<UserLessonProgress> UserLessonProgresses { get; set; }
    public DbSet<Badge> Badges { get; set; }
    public DbSet<UserBadge> UserBadges { get; set; }
    public DbSet<Rank> Ranks { get; set; }
    public DbSet<UserRank> UserRanks { get; set; }
    public DbSet<UserStats> UserStats { get; set; }
    public DbSet<ForumQuestion> ForumQuestions { get; set; }
    public DbSet<ForumComment> ForumComments { get; set; }
    public DbSet<ForumQuestionVote> ForumQuestionVotes { get; set; }
    public DbSet<KnownError> KnownErrors { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.PhotoUrl).HasMaxLength(500);
            entity.Property(e => e.Role).HasConversion<int>();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Content configuration
        modelBuilder.Entity<Content>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Subtitle).HasMaxLength(300);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Type).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.HasOne(e => e.Category).WithMany(c => c.Contents).HasForeignKey(e => e.CategoryId);
            entity.HasOne(e => e.Author).WithMany(u => u.Contents).HasForeignKey(e => e.AuthorId);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        // Process configuration
        modelBuilder.Entity<Process>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Subtitle).HasMaxLength(300);
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.HasOne(e => e.Category).WithMany(c => c.Processes).HasForeignKey(e => e.CategoryId);
            entity.HasOne(e => e.Author).WithMany().HasForeignKey(e => e.AuthorId);
        });

        // Activity configuration
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Type).HasConversion<int>();
            entity.Property(e => e.Level).HasConversion<int>();
            entity.HasOne(e => e.Content).WithMany(c => c.Activities).HasForeignKey(e => e.ContentId);
            entity.HasOne(e => e.Process).WithMany(p => p.Activities).HasForeignKey(e => e.ProcessId);
            entity.HasOne(e => e.Author).WithMany(u => u.Activities).HasForeignKey(e => e.AuthorId);
        });

        // Question configuration
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Text).IsRequired();
            entity.HasOne(e => e.Activity).WithMany(a => a.Questions).HasForeignKey(e => e.ActivityId);
        });

        // Answer configuration
        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Text).IsRequired();
            entity.HasOne(e => e.Question).WithMany(q => q.Answers).HasForeignKey(e => e.QuestionId);
        });

        // UserActivity configuration
        modelBuilder.Entity<UserActivity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Activity).WithMany(a => a.UserActivities).HasForeignKey(e => e.ActivityId);
        });

        // LearningLog configuration
        modelBuilder.Entity<LearningLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Details).HasMaxLength(1000);
            entity.HasOne(e => e.User).WithMany(u => u.LearningLogs).HasForeignKey(e => e.UserId);
        });

        // Quiz configuration
        modelBuilder.Entity<Quiz>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.HasOne(e => e.Activity).WithMany().HasForeignKey(e => e.ActivityId);
        });

        // QuizQuestion configuration
        modelBuilder.Entity<QuizQuestion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuestionText).IsRequired();
            entity.HasOne(e => e.Quiz).WithMany(q => q.QuizQuestions).HasForeignKey(e => e.QuizId);
        });

        // QuizOption configuration
        modelBuilder.Entity<QuizOption>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OptionText).IsRequired();
            entity.HasOne(e => e.QuizQuestion).WithMany(q => q.Options).HasForeignKey(e => e.QuizQuestionId);
        });

        // Course configuration
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);
            entity.Property(e => e.Level).HasConversion<int>();
            entity.HasOne(e => e.Category).WithMany().HasForeignKey(e => e.CategoryId);
            entity.HasOne(e => e.Author).WithMany().HasForeignKey(e => e.AuthorId);
        });

        // CourseLesson configuration
        modelBuilder.Entity<CourseLesson>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.HasOne(e => e.Course).WithMany(c => c.Lessons).HasForeignKey(e => e.CourseId);
        });

        // UserCourse configuration
        modelBuilder.Entity<UserCourse>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Course).WithMany(c => c.UserCourses).HasForeignKey(e => e.CourseId);
        });

        // UserLessonProgress configuration
        modelBuilder.Entity<UserLessonProgress>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Lesson).WithMany(l => l.UserProgress).HasForeignKey(e => e.LessonId);
            entity.HasOne(e => e.UserCourse).WithMany(uc => uc.LessonProgress).HasForeignKey(e => e.UserCourseId);
        });

        // Badge configuration
        modelBuilder.Entity<Badge>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IconUrl).HasMaxLength(500);
            entity.Property(e => e.Rarity).HasConversion<int>();
        });

        // UserBadge configuration
        modelBuilder.Entity<UserBadge>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Badge).WithMany(b => b.UserBadges).HasForeignKey(e => e.BadgeId);
        });

        // Rank configuration
        modelBuilder.Entity<Rank>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.IconUrl).HasMaxLength(500);
            entity.Property(e => e.Color).HasMaxLength(20);
        });

        // UserRank configuration
        modelBuilder.Entity<UserRank>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Rank).WithMany(r => r.UserRanks).HasForeignKey(e => e.RankId);
        });

        // UserStats configuration
        modelBuilder.Entity<UserStats>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithOne().HasForeignKey<UserStats>(e => e.UserId);
        });

        // ForumQuestion configuration
        modelBuilder.Entity<ForumQuestion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Author).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Tag).HasMaxLength(100).IsRequired();
        });

        // ForumComment configuration
        modelBuilder.Entity<ForumComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Author).HasMaxLength(120).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.HasOne(e => e.ForumQuestion)
                  .WithMany(q => q.Comments)
                  .HasForeignKey(e => e.ForumQuestionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ForumQuestionVote configuration
        modelBuilder.Entity<ForumQuestionVote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ForumQuestionId, e.UserId }).IsUnique();
            entity.HasOne(e => e.ForumQuestion)
                  .WithMany(q => q.UserVotes)
                  .HasForeignKey(e => e.ForumQuestionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // KnownError configuration
        modelBuilder.Entity<KnownError>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Description).IsRequired();
            entity.Property(e => e.Type).HasMaxLength(30).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Severity).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Solution).IsRequired();
            entity.Property(e => e.StepsToFixJson).IsRequired();
            entity.Property(e => e.Source).HasMaxLength(50).IsRequired();
        });
    }
}
