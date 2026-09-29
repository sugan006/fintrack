using FinTrack.Api.Common;
using FinTrack.Api.DTOs.Accounts;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/accounts")]
public class AccountsController(IAccountService accountService) : ControllerBase
{
    [HttpGet]
public async Task<ActionResult<List<AccountResponse>>> GetAll() =>
        Ok(await accountService.GetAllAsync(User.GetUserId()));

[HttpGet("{id:int}")]
public async Task<ActionResult<AccountResponse>> GetById(int id)
{
    var account = await accountService.GetByIdAsync(User.GetUserId(), id);
    return account is null ? NotFound() : Ok(account);
}

[HttpPost]
public async Task<ActionResult<AccountResponse>> Create(CreateAccountRequest request)
{
    var account = await accountService.CreateAsync(User.GetUserId(), request);
    return CreatedAtAction(nameof(GetById), new { id = account.Id }, account);
}

[HttpPut("{id:int}")]
public async Task<ActionResult<AccountResponse>> Update(int id, UpdateAccountRequest request)
{
    var account = await accountService.UpdateAsync(User.GetUserId(), id, request);
    return account is null ? NotFound() : Ok(account);
}

[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id)
{
    var result = await accountService.DeleteAsync(User.GetUserId(), id);
    return result switch
    {
        DeleteAccountResult.NotFound => NotFound(),
        DeleteAccountResult.HasTransactions => Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Account has transactions and cannot be deleted."),
        _ => NoContent()
    };
}
}