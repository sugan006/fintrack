using FinTrack.Api.Common;
using FinTrack.Api.DTOs.Transfers;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/transfers")]
public class TransfersController(ITransferService transferService) : ControllerBase
{
    [HttpPost]
public async Task<ActionResult<TransferResponse>> Create(TransferRequest request)
{
    var result = await transferService.CreateAsync(User.GetUserId(), request);
    return StatusCode(StatusCodes.Status201Created, result);
}
}