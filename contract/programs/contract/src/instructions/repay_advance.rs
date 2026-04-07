use anchor_lang::prelude::*;

use crate::errors::FlowFiError;
use crate::state::AdvanceAccount;


#[derive(Accounts)]
pub struct RepayAdvance<'info> {
    
    #[account(mut)]
    pub authority: Signer<'info>,


    #[account(
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            &escrow_account.dodo_invoice_id.as_bytes()[..std::cmp::min(escrow_account.dodo_invoice_id.len(), 32)],
        ],
        bump = escrow_account.bump,
    )]
    pub escrow_account: Box<Account<'info, crate::state::EscrowAccount>>,

   
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
        advance.escrow,
        advance.advance_amount,
    );

    Ok(())
}
