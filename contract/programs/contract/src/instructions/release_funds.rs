use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::errors::FlowFiError;
use crate::state::{EscrowAccount, EscrowStatus};

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {

  
    #[account(mut)]
    pub authority: Signer<'info>,


    pub usdc_mint: InterfaceAccount<'info, Mint>,


    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            &escrow_account.dodo_invoice_id.as_bytes()[..std::cmp::min(escrow_account.dodo_invoice_id.len(), 32)],
        ],
        bump = escrow_account.bump,
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
        associated_token::authority = escrow_account.freelancer,
        associated_token::token_program = token_program,
    )]
    pub freelancer_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

    
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

   
    require!(
        escrow.status == EscrowStatus::Funded,
        FlowFiError::EscrowNotFunded
    );

  
    require!(
        escrow.milestone_approved,
        FlowFiError::MilestoneNotApproved
    );

   
    escrow.status = EscrowStatus::Released;

    
    let release_amount = ctx.accounts.vault.amount;

    if release_amount == 0 {
       
        msg!("FlowFi: release_funds — vault empty after advance, marking Released");
        return Ok(());
    }

   
    let invoice_bytes = escrow.dodo_invoice_id.as_bytes().to_vec();
    let client_key = escrow.client;
    let bump = escrow.bump;

    let seeds: &[&[u8]] = &[
        b"escrow",
        client_key.as_ref(),
        invoice_bytes.as_slice(),
        &[bump],
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
    transfer_checked(cpi_ctx, release_amount, decimals)?;

    msg!(
        "FlowFi: funds released — invoice: {}, amount: {}, freelancer: {}",
        escrow.dodo_invoice_id,
        release_amount,
        escrow.freelancer,
    );

    Ok(())
}
