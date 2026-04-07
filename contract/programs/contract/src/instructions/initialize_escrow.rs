use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::errors::FlowFiError;
use crate::state::{EscrowAccount, EscrowStatus};


#[derive(Accounts)]
#[instruction(dodo_invoice_id: String, amount: u64, freelancer: Pubkey)]
pub struct InitializeEscrow<'info> {

    #[account(mut)]
    pub client: Signer<'info>,

   
    pub usdc_mint: InterfaceAccount<'info, Mint>,

   
    #[account(
        init,
        payer = client,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [
            b"escrow",
            client.key().as_ref(),
            &dodo_invoice_id.as_bytes()[..std::cmp::min(dodo_invoice_id.len(), 32)],
        ],
        bump,
    )]
    pub escrow_account: Box<Account<'info, EscrowAccount>>,

   
    #[account(
        init,
        payer = client,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow_account,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,


    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


pub fn initialize_escrow(
    ctx: Context<InitializeEscrow>,
    dodo_invoice_id: String,
    amount: u64,
    freelancer: Pubkey,
) -> Result<()> {
   
    require!(amount > 0, FlowFiError::ZeroAmount);

    
    require!(
        dodo_invoice_id.len() <= 32,
        FlowFiError::InvoiceIdTooLong
    );

   
    let escrow = &mut ctx.accounts.escrow_account;
    let clock = Clock::get()?;

    escrow.client = ctx.accounts.client.key();
    escrow.freelancer = freelancer;
    escrow.amount = amount;
    escrow.dodo_invoice_id = dodo_invoice_id;
    escrow.status = EscrowStatus::Created;
    escrow.advanced = false;
    escrow.advance_amount = 0;
    escrow.milestone_approved = false;
    escrow.bump = ctx.bumps.escrow_account;
    
    escrow.vault_bump = 0;
    escrow.created_at = clock.unix_timestamp;

    msg!(
        "FlowFi: escrow initialized — invoice: {}, amount: {}, client: {}, freelancer: {}",
        escrow.dodo_invoice_id,
        escrow.amount,
        escrow.client,
        escrow.freelancer,
    );

    Ok(())
}
