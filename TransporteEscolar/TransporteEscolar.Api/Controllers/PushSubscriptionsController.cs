using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Api.Controllers;

[ApiController]
[Route("api/push-subscriptions")]
public class PushSubscriptionsController : ControllerBase
{
    private readonly IPushSubscriptionRepository _repository;
    private readonly IWebPushService _webPushService;
    private readonly ILogger<PushSubscriptionsController> _logger;

    public PushSubscriptionsController(
        IPushSubscriptionRepository repository,
        IWebPushService webPushService,
        ILogger<PushSubscriptionsController> logger)
    {
        _repository = repository;
        _webPushService = webPushService;
        _logger = logger;
    }

    [HttpGet("vapid-public-key")]
    public ActionResult<PushSubscriptionModel.VapidPublicKeyResponse> GetVapidPublicKey()
    {
        var publicKey = _webPushService.ObtenerClavePublicaVapid();
        return Ok(new PushSubscriptionModel.VapidPublicKeyResponse(publicKey));
    }

    [HttpPost("subscribe")]
    public async Task<ActionResult> Subscribe(
        [FromBody] PushSubscriptionModel.SubscribeRequest request,
        CancellationToken cancellationToken)
    {
        var existente = await _repository.GetByEndpointAsync(request.Endpoint, cancellationToken);

        if (existente is not null)
        {
            existente.Actualizar(request.P256dh, request.Auth, request.UserAgent);
            await _repository.UpdateAsync(existente, cancellationToken);
            _logger.LogInformation("Suscripcion push actualizada para endpoint existente");
        }
        else
        {
            var nueva = new PushSubscription(request.Endpoint, request.P256dh, request.Auth, request.UserAgent);
            await _repository.AddAsync(nueva, cancellationToken);
            _logger.LogInformation("Nueva suscripcion push registrada");
        }

        return NoContent();
    }

    [HttpPost("unsubscribe")]
    public async Task<ActionResult> Unsubscribe(
        [FromBody] PushSubscriptionModel.UnsubscribeRequest request,
        CancellationToken cancellationToken)
    {
        await _repository.DeleteByEndpointAsync(request.Endpoint, cancellationToken);
        _logger.LogInformation("Suscripcion push eliminada");
        return NoContent();
    }

    [HttpPost("test")]
    public async Task<ActionResult> TestPush(CancellationToken cancellationToken)
    {
        await _webPushService.EnviarATodosAsync(
            "Notificacion de prueba",
            "Si ves esto, las notificaciones push funcionan correctamente",
            "/",
            cancellationToken);

        return Ok(new { mensaje = "Push de prueba enviado" });
    }
}
