use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::errors::FlowFiError;
use crate::state::{AdvanceAccount, EscrowAccount, EscrowStatus};


#[derive(Accounts)]
pub struct RequestAdvance<'info> {
    
    #[account(mut)]
    pub freelancer: Signer<'info>,

   
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    
    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            &escrow_account.dodo_invoice_id.as_bytes()[..std::cmp::min(escrow_account.dodo_invoice_id.len(), 32)],
        ],
        bump = escrow_account.bump,
       
        has_one = freelancer @ FlowFiError::UnauthorizedFreelancer,
    )]
    pub escrow_account: Box<Account<'info, EscrowAccount>>,

    
    #[account(
        mut,
        associated_token::mint      = usdc_mint,
        associated_token::authority = escrow_account,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,


    #[account(
        mut,
        associated_token::mint      = usdc_mint,
        associated_token::authority = freelancer,
        associated_token::token_program = token_program,
    )]
    pub freelancer_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

 
    #[account(
        init,
        payer = freelancer,
        space = 8 + AdvanceAccount::INIT_SPACE,
        seeds = [b"advance", escrow_account.key().as_ref()],
        bump,
    )]
    pub advance_account: Box<Account<'info, AdvanceAccount>>,

   
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


pub fn request_advance(ctx: Context<RequestAdvance>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

   
    require!(
        escrow.status == EscrowStatus::Funded,
        FlowFiError::EscrowNotFunded
    );

  
    require!(!escrow.advanced, FlowFiError::AdvanceAlreadyTaken);

   
    let advance_amount = escrow
        .amount
        .checked_mul(85)
        .ok_or(FlowFiError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(FlowFiError::ArithmeticOverflow)?;

   
    escrow.advanced = true;
    escrow.advance_amount = advance_amount;

    
    let clock = Clock::get()?;
    let advance = &mut ctx.accounts.advance_account;
    advance.escrow = escrow.key();
    advance.advance_amount = advance_amount;
    advance.repaid = false;
    advance.timestamp = clock.unix_timestamp;
    advance.bump = ctx.bumps.advance_account;


    let invoice_bytes = escrow.dodo_invoice_id.as_bytes().to_vec();
    let client_key = escrow.client;
    let escrow_bump = escrow.bump;

    let seeds: &[&[u8]] = &[
        b"escrow",
        client_key.as_ref(),
        invoice_bytes.as_slice(),
        &[escrow_bump],
    ];
    let signer_seeds = &[seeds];

    
    let decimals = ctx.accounts.usdc_mint.decimals;
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
        to: ctx.accounts.freelancer_usdc_account.to_account_info(),
        authority: escrow.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    transfer_checked(cpi_ctx, advance_amount, decimals)?;

    msg!(
        "FlowFi: advance issued — invoice: {}, advance: {} (85%), freelancer: {}",
        escrow.dodo_invoice_id,
        advance_amount,
        escrow.freelancer,
    );

    Ok(())
}
