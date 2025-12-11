var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<EncryptionSettings>(builder.Configuration.GetSection("Encryption"));
builder.Services.Configure<ApiKeySettings>(builder.Configuration.GetSection("ApiKey"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connectionString);
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Ensure schema exists (script is also provided under /db)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.EnsureCreatedAsync();

    // Make sure legacy inline file storage column is removed and disk path column exists
    const string fixFilesSql = @"
IF OBJECT_ID('dbo.CredentialFiles', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.CredentialFiles', 'FilePath') IS NULL
    BEGIN
        ALTER TABLE [dbo].[CredentialFiles] ADD [FilePath] NVARCHAR(400) NOT NULL CONSTRAINT DF_CredentialFiles_FilePath DEFAULT '';
    END

    IF COL_LENGTH('dbo.CredentialFiles', 'Data') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[CredentialFiles] DROP COLUMN [Data];
    END
END
";
    await db.Database.ExecuteSqlRawAsync(fixFilesSql);
}

app.UseSwagger();
app.UseSwaggerUI();

// Local dev: avoid redirecting preflight requests; enforce HTTPS only outside Development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseApiKeyValidation();

app.MapControllers();
app.MapGet("/health", () => Results.Ok("ok"));

app.Run();
