use anchor_lang::prelude::*;
use crate::state::{EscrowAccount, id_seed, EscrowStatus};
use crate::errors::FlowFiError;

#[derive(Accounts)]
pub struct ApproveMilestone<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            id_seed(&escrow_account.dodo_invoice_id),
        ],
        bump = escrow_account.bump,
        has_one = client @ FlowFiError::UnauthorizedClient,
    )]
    pub escrow_account: Box<Account<'info, EscrowAccount>>,
}

pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

    require!(escrow.status == EscrowStatus::Funded, FlowFiError::EscrowNotFunded);

    escrow.milestone_approved = true;
    msg!(
        "FlowFi: milestone approved — invoice: {}, client: {}",
        escrow.dodo_invoice_id, ctx.accounts.client.key(),
    );
    Ok(())
}