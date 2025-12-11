namespace NoraxCredentials.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CredentialsController(ApplicationDbContext db, IEncryptionService encryption) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CredentialResponseDto>>> GetAll([FromQuery] Guid? categoryId = null)
    {
        var query = db.Credentials.AsQueryable();
        if (categoryId.HasValue)
        {
            query = query.Where(c => c.CategoryId == categoryId);
        }

        var userId = GetUserId();
        var isAdmin = User.IsInRole("Admin");
        var allowedIds = new HashSet<Guid>();
        if (!isAdmin && userId.HasValue)
        {
            var userIdValue = userId.Value;
            var allowed = await db.UserCredentialAccesses
                .Where(a => a.UserId == userIdValue)
                .Select(a => a.CredentialId)
                .ToListAsync();
            allowedIds = new HashSet<Guid>(allowed);
        }

        var items = await query
            .OrderByDescending(c => c.UpdatedAtUtc)
            .ToListAsync();

        return Ok(items.Select(c => MapToDto(c, isAdmin || allowedIds.Contains(c.Id))));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CredentialResponseDto>> GetById(Guid id)
    {
        var entity = await db.Credentials.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        var userId = GetUserId();
        var isAdmin = User.IsInRole("Admin");
        var canView = isAdmin || (userId.HasValue && await db.UserCredentialAccesses.AnyAsync(a => a.CredentialId == id && a.UserId == userId.Value));
        return MapToDto(entity, canView);
    }

    [HttpPost]
    public async Task<ActionResult<CredentialResponseDto>> Create([FromBody] CreateCredentialDto dto)
    {
        if (!User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var categoryExists = await db.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Kategori bulunamadı.");
        }

        var item = new CredentialItem
        {
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            HostOrUrl = dto.HostOrUrl?.Trim(),
            Username = dto.Username?.Trim(),
            EncryptedPassword = encryption.Encrypt(dto.Password),
            EncryptedConnectionString = encryption.Encrypt(dto.ConnectionString),
            EncryptedNotes = encryption.Encrypt(dto.Notes),
            AppName = dto.AppName?.Trim(),
            AppLink = dto.AppLink?.Trim(),
            AccountFirstName = dto.AccountFirstName?.Trim(),
            AccountLastName = dto.AccountLastName?.Trim(),
            AccountEmail = dto.AccountEmail?.Trim(),
            AccountRole = dto.AccountRole?.Trim(),
            ServerVpnRequired = dto.ServerVpnRequired,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        db.Credentials.Add(item);
        await db.SaveChangesAsync();

        var response = MapToDto(item, true);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CredentialResponseDto>> Update(Guid id, [FromBody] UpdateCredentialDto dto)
    {
        var item = await db.Credentials.FindAsync(id);
        if (item is null)
        {
            return NotFound();
        }

        var userId = GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && userId.HasValue)
        {
            var hasSpecificAssignments = await db.UserCredentialAccesses.AnyAsync(a => a.CredentialId == id);
            if (hasSpecificAssignments)
            {
                var allowed = await db.UserCredentialAccesses.AnyAsync(a => a.CredentialId == id && a.UserId == userId.Value);
                if (!allowed)
                {
                    return Forbid();
                }
            }
        }

        var categoryExists = await db.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Kategori bulunamadı.");
        }

        item.CategoryId = dto.CategoryId;
        item.Name = dto.Name.Trim();
        item.HostOrUrl = dto.HostOrUrl?.Trim();
        item.Username = dto.Username?.Trim();
        item.EncryptedPassword = encryption.Encrypt(dto.Password);
        item.EncryptedConnectionString = encryption.Encrypt(dto.ConnectionString);
        item.EncryptedNotes = encryption.Encrypt(dto.Notes);
        item.AppName = dto.AppName?.Trim();
        item.AppLink = dto.AppLink?.Trim();
        item.AccountFirstName = dto.AccountFirstName?.Trim();
        item.AccountLastName = dto.AccountLastName?.Trim();
        item.AccountEmail = dto.AccountEmail?.Trim();
        item.AccountRole = dto.AccountRole?.Trim();
        item.ServerVpnRequired = dto.ServerVpnRequired;
        item.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        var currentUserId = GetUserId();
        var currentIsAdmin = User.IsInRole("Admin");
        var canView = currentIsAdmin || (currentUserId.HasValue && await db.UserCredentialAccesses.AnyAsync(a => a.CredentialId == id && a.UserId == currentUserId.Value));
        return MapToDto(item, canView);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Credentials.FindAsync(id);
        if (item is null)
        {
            return NotFound();
        }

        var userId = GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && userId.HasValue)
        {
            var allowed = await db.UserCredentialAccesses.AnyAsync(a => a.CredentialId == id && a.UserId == userId.Value);
            if (!allowed)
            {
                return Forbid();
            }
        }

        db.Credentials.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private CredentialResponseDto MapToDto(CredentialItem entity, bool canViewSecret = true)
    {
        var password = canViewSecret ? encryption.Decrypt(entity.EncryptedPassword) : null;
        var conn = canViewSecret ? encryption.Decrypt(entity.EncryptedConnectionString) : null;
        var notes = canViewSecret ? encryption.Decrypt(entity.EncryptedNotes) : null;

        return new CredentialResponseDto(
            entity.Id,
            entity.CategoryId,
            entity.Name,
            entity.HostOrUrl,
            entity.Username,
            password,
            conn,
            notes,
            entity.AppName,
            entity.AppLink,
            entity.AccountFirstName,
            entity.AccountLastName,
            entity.AccountEmail,
            entity.AccountRole,
            entity.ServerVpnRequired,
            canViewSecret,
            entity.CreatedAtUtc,
            entity.UpdatedAtUtc
        );
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(userIdClaim, out var id) ? id : null;
    }
}
