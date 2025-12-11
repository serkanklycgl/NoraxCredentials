namespace NoraxCredentials.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CredentialsController(ApplicationDbContext db, IEncryptionService encryption, IWebHostEnvironment env) : ControllerBase
{
    private readonly string _uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

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
            .Include(c => c.Files)
            .ToListAsync();

        return Ok(items.Select(c => MapToDto(c, isAdmin || allowedIds.Contains(c.Id))));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CredentialResponseDto>> GetById(Guid id)
    {
        var entity = await db.Credentials.Include(c => c.Files).FirstOrDefaultAsync(c => c.Id == id);
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

        Directory.CreateDirectory(_uploadsRoot);

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
        Directory.CreateDirectory(_uploadsRoot);
        var item = await db.Credentials.Include(c => c.Files).FirstOrDefaultAsync(c => c.Id == id);
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
        var item = await db.Credentials.Include(c => c.Files).FirstOrDefaultAsync(c => c.Id == id);
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
        foreach (var file in item.Files)
        {
            DeletePhysicalFile(file.FilePath);
        }
        return NoContent();
    }

    [HttpPost("{id:guid}/files")]
    public async Task<ActionResult<CredentialFileDto>> UploadFile(Guid id, IFormFile file)
    {
        var credential = await db.Credentials.Include(c => c.Files).FirstOrDefaultAsync(c => c.Id == id);
        if (credential is null) return NotFound();

        if (!await HasAccess(id)) return Forbid();

        if (file is null || file.Length == 0) return BadRequest("Dosya boş.");
        if (file.Length > 10 * 1024 * 1024) return BadRequest("Dosya 10MB sınırını aşıyor.");

        Directory.CreateDirectory(_uploadsRoot);
        var safeName = Path.GetFileName(file.FileName);
        var uniqueName = $"{Guid.NewGuid():N}_{safeName}";
        var fullPath = Path.Combine(_uploadsRoot, uniqueName);
        using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var entity = new CredentialFile
        {
          CredentialId = id,
          FileName = safeName,
          ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
          Size = file.Length,
          FilePath = fullPath,
          UploadedAtUtc = DateTime.UtcNow
        };

        db.CredentialFiles.Add(entity);
        await db.SaveChangesAsync();

        var dto = new CredentialFileDto(entity.Id, entity.CredentialId, entity.FileName, entity.ContentType, entity.Size, entity.UploadedAtUtc);
        return CreatedAtAction(nameof(DownloadFile), new { id, fileId = entity.Id }, dto);
    }

    [HttpGet("{id:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> DownloadFile(Guid id, Guid fileId)
    {
        var file = await db.CredentialFiles.FirstOrDefaultAsync(f => f.CredentialId == id && f.Id == fileId);
        if (file is null) return NotFound();
        if (!await HasAccess(id)) return Forbid();

        if (!System.IO.File.Exists(file.FilePath)) return NotFound();
        return PhysicalFile(file.FilePath, file.ContentType, file.FileName);
    }

    [HttpDelete("{id:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> DeleteFile(Guid id, Guid fileId)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        var file = await db.CredentialFiles.FirstOrDefaultAsync(f => f.CredentialId == id && f.Id == fileId);
        if (file is null) return NotFound();
        DeletePhysicalFile(file.FilePath);
        db.CredentialFiles.Remove(file);
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
            entity.Files.Select(f => new CredentialFileDto(f.Id, f.CredentialId, f.FileName, f.ContentType, f.Size, f.UploadedAtUtc)).ToList(),
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

    private async Task<bool> HasAccess(Guid credentialId)
    {
        var userId = GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (isAdmin) return true;
        if (!userId.HasValue) return false;
        return await db.UserCredentialAccesses.AnyAsync(a => a.CredentialId == credentialId && a.UserId == userId.Value);
    }

    private void DeletePhysicalFile(string path)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(path) && System.IO.File.Exists(path))
            {
                System.IO.File.Delete(path);
            }
        }
        catch
        {
            // ignore cleanup errors
        }
    }
}
