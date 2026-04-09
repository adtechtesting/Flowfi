use anchor_lang::prelude::*;
use crate::state::{AdvanceAccount, EscrowAccount, id_seed};
use crate::errors::FlowFiError;

#[derive(Accounts)]
pub struct RepayAdvance<'info> {
    /// CHECK: verified via constraint against escrow_account.authority
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            id_seed(&escrow_account.dodo_invoice_id),
        ],
        bump = escrow_account.bump,
        constraint = escrow_account.authority == authority.key() @ FlowFiError::UnauthorizedAuthority,
    )]
    pub escrow_account: Box<Account<'info, EscrowAccount>>,

    #[account(
        mut,
        seeds = [b"advance", escrow_account.key().as_ref()],
        bump = advance_account.bump,
        constraint = advance_account.escrow == escrow_account.key() @ FlowFiError::UnauthorizedAuthority,
    )]
    pub advance_account: Box<Account<'info, AdvanceAccount>>,
}

pub fn repay_advance(ctx: Context<RepayAdvance>) -> Result<()> {
    let advance = &mut ctx.accounts.advance_account;

    require!(!advance.repaid, FlowFiError::AdvanceAlreadyRepaid);

    advance.repaid = true;
    msg!(
        "FlowFi: advance repaid — escrow: {}, amount: {}",
        advance.escrow, advance.advance_amount,
    );
    Ok(())
}