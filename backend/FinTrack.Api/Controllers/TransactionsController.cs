using FinTrack.Api.Common;
using FinTrack.Api.DTOs.Transactions;
using FinTrack.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinTrack.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/transactions")]
public class TransactionsController(ITransactionService transactionService) : ControllerBase
{
    [HttpGet("{id:int}")]
public async Task<ActionResult<TransactionResponse>> GetById(int id)
{
    var transaction = await transactionService.GetByIdAsync(User.GetUserId(), id);
    return transaction is null ? NotFound() : Ok(transaction);
}

[HttpPost]
public async Task<ActionResult<TransactionResponse>> Create(CreateTransactionRequest request)
{
    var transaction = await transactionService.CreateAsync(User.GetUserId(), request);
    return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, transaction);
}

[HttpPut("{id:int}")]
public async Task<ActionResult<TransactionResponse>> Update(int id, UpdateTransactionRequest request) =>
    Ok(await transactionService.UpdateAsync(User.GetUserId(), id, request));

[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id)
{
    await transactionService.DeleteAsync(User.GetUserId(), id);
    return NoContent();
}
}