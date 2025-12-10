[ApiController]
[Route("api/[controller]")]
public class AuthController(ApplicationDbContext db, IPasswordHasher hasher, ITokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var hasUsers = await db.Users.AnyAsync();
        var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
        if (hasUsers && !isAuthenticated)
        {
            return Unauthorized("Yeni kullanıcı eklemek için oturum açın.");
        }

        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            return Conflict("E-posta kullanılıyor.");
        }

        var user = new User
        {
            Email = email,
            PasswordHash = hasher.HashPassword(dto.Password),
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = tokenService.GenerateToken(user);
        return new AuthResponseDto(token, new UserProfileDto(user.Id, user.Email, user.Role));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !hasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Geçersiz kullanıcı veya parola.");
        }

        var token = tokenService.GenerateToken(user);
        return new AuthResponseDto(token, new UserProfileDto(user.Id, user.Email, user.Role));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileDto>> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        return new UserProfileDto(user.Id, user.Email, user.Role);
    }
}
