use anchor_lang::prelude::*;

use crate::errors::FlowFiError;
use crate::state::{EscrowAccount, EscrowStatus};


#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
  
    #[account(mut)]
    pub client: Signer<'info>,

   
    #[account(
        mut,
       
        seeds = [
            b"escrow",
            client.key().as_ref(),
            &escrow_account.dodo_invoice_id.as_bytes()[..std::cmp::min(escrow_account.dodo_invoice_id.len(), 32)],
        ],
        bump = escrow_account.bump,
        
        has_one = client @ FlowFiError::UnauthorizedClient,
    )]
    pub escrow_account: Box<Account<'info, EscrowAccount>>,
}


///
/// # Security checklist
/// ✅ Only escrow.client can call (has_one + signer check)
/// ✅ Escrow must be Funded (work must be locked before approval)
/// ✅ Cannot approve if already Released (no-op guard)
/// ✅ Re-entrancy safe (no cross-program calls)
pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

   
    require!(
        escrow.status == EscrowStatus::Funded,
        FlowFiError::EscrowNotFunded
    );

   
    require!(
        escrow.status != EscrowStatus::Released,
        FlowFiError::AlreadyReleased
    );

   
    escrow.milestone_approved = true;

    msg!(
        "FlowFi: milestone approved — invoice: {}, client: {}",
        escrow.dodo_invoice_id,
        ctx.accounts.client.key(),
    );

    Ok(())
}
