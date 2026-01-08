using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Infrastructure.Persistence;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) => _db = db;

    [HttpGet("db")]
    public async Task<IActionResult> Db()
    {
        var canConnect = await _db.Database.CanConnectAsync();
        return Ok(new { database = canConnect ? "up" : "down" });
    }
}
