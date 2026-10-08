using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Api.Controllers;

/// <summary>
/// Login de la cuenta compartida. Público por diseño. Responde 401 con el mismo mensaje si falla el usuario o la
/// contraseña, y 503 si el servidor no tiene la cuenta o el secreto configurados (falla cerrado).
/// </summary>
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private const string MensajeInvalido = "Usuario o contraseña incorrectos";

    private readonly AuthOptions _auth;
    private readonly TokenService _tokens;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IOptions<AuthOptions> auth, TokenService tokens, ILogger<AuthController> logger)
    {
        _auth = auth.Value;
        _tokens = tokens;
        _logger = logger;
    }

    /// <summary>Inicia sesión. 200 con token (30 días por defecto); 400 sin datos; 401 credenciales inválidas; 503 sin configurar.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthModel.LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public ActionResult<AuthModel.LoginResponse> Login([FromBody] AuthModel.LoginRequest? request)
    {
        // 1) Config primero (falla cerrado).
        if (string.IsNullOrWhiteSpace(_auth.Usuario) || string.IsNullOrWhiteSpace(_auth.PasswordHash) || !_tokens.Configurado)
        {
            _logger.LogWarning("Login rechazado: faltan Auth:Usuario, Auth:PasswordHash o Jwt:Secret (mínimo 32 bytes)");
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        }

        if (request is null || string.IsNullOrEmpty(request.Usuario) || string.IsNullOrEmpty(request.Password))
            return BadRequest(new { message = "Usuario y contraseña son obligatorios" });

        // 2) Siempre se ejecuta el PBKDF2 y se compara el usuario en tiempo constante, para que el tiempo de
        //    respuesta no revele si falló el usuario o la contraseña.
        var usuarioOk = CryptographicOperations.FixedTimeEquals(
            SHA256.HashData(Encoding.UTF8.GetBytes(request.Usuario)),
            SHA256.HashData(Encoding.UTF8.GetBytes(_auth.Usuario)));
        var passwordOk = PasswordHasher.Verificar(request.Password, _auth.PasswordHash);

        if (!usuarioOk || !passwordOk)
        {
            _logger.LogWarning("Login fallido");
            return Unauthorized(new { message = MensajeInvalido });
        }

        var (token, expira) = _tokens.Emitir(_auth.Usuario);
        _logger.LogInformation("Login correcto");
        return Ok(new AuthModel.LoginResponse(token, expira));
    }
}
