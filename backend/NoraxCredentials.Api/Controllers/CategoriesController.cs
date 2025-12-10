namespace NoraxCredentials.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController(ApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetAll()
    {
        var categories = await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponseDto(c.Id, c.Name, c.Description))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryResponseDto>> GetById(Guid id)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound();
        }

        return new CategoryResponseDto(category.Id, category.Name, category.Description);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponseDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var exists = await db.Categories.AnyAsync(c => c.Name == dto.Name);
        if (exists)
        {
            return Conflict($"Kategori zaten mevcut: {dto.Name}");
        }

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim()
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var result = new CategoryResponseDto(category.Id, category.Name, category.Description);
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryResponseDto>> Update(Guid id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound();
        }

        var nameConflict = await db.Categories.AnyAsync(c => c.Id != id && c.Name == dto.Name);
        if (nameConflict)
        {
            return Conflict($"Kategori adı kullanımda: {dto.Name}");
        }

        category.Name = dto.Name.Trim();
        category.Description = dto.Description?.Trim();

        await db.SaveChangesAsync();
        return new CategoryResponseDto(category.Id, category.Name, category.Description);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await db.Categories.Include(c => c.Credentials).FirstOrDefaultAsync(c => c.Id == id);
        if (category is null)
        {
            return NotFound();
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
