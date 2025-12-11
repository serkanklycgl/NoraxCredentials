namespace NoraxCredentials.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController(ApplicationDbContext db, IPasswordHasher hasher) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
    {
        var users = await db.Users
            .Include(u => u.CredentialAccesses)
            .OrderBy(u => u.Email)
            .ToListAsync();

        return Ok(users.Select(MapUserToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await db.Users.Include(u => u.CredentialAccesses).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        return MapUserToDto(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
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

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, MapUserToDto(user));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await db.Users.Include(u => u.CredentialAccesses).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        var email = dto.Email.Trim().ToLowerInvariant();
        var emailConflict = await db.Users.AnyAsync(u => u.Id != id && u.Email == email);
        if (emailConflict)
        {
            return Conflict("E-posta kullanılıyor.");
        }

        user.Email = email;
        user.Role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = hasher.HashPassword(dto.Password);
        }

        await db.SaveChangesAsync();
        return MapUserToDto(user);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id:guid}/access")]
    public async Task<ActionResult<UserDto>> UpdateAccess(Guid id, [FromBody] UpdateUserAccessDto dto)
    {
        var user = await db.Users.Include(u => u.CredentialAccesses).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        var targetIds = dto.CredentialIds?.Distinct().ToList() ?? new List<Guid>();
        var validIds = await db.Credentials.Where(c => targetIds.Contains(c.Id)).Select(c => c.Id).ToListAsync();

        var existing = db.UserCredentialAccesses.Where(a => a.UserId == id);
        db.UserCredentialAccesses.RemoveRange(existing);

        foreach (var credId in validIds)
        {
            db.UserCredentialAccesses.Add(new UserCredentialAccess
            {
                UserId = id,
                CredentialId = credId,
                GrantedAtUtc = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();

        var refreshed = await db.Users.Include(u => u.CredentialAccesses).FirstAsync(u => u.Id == id);
        return MapUserToDto(refreshed);
    }

    private static UserDto MapUserToDto(User user) =>
        new(user.Id, user.Email, user.Role, user.CredentialAccesses.Select(a => a.CredentialId).ToArray());
}
