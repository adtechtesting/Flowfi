use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked},
};
use crate::state::{EscrowAccount, id_seed, EscrowStatus};
use crate::errors::FlowFiError;

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    /// CHECK: verified via constraint against escrow_account.authority
    #[account(mut)]
    pub authority: Signer<'info>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            id_seed(&escrow_account.dodo_invoice_id),
        ],
        bump = escrow_account.bump,
        // Only the stored authority can release
        constraint = escrow_account.authority == authority.key() @ FlowFiError::UnauthorizedAuthority,
    )]
    pub escrow_account: Box<Account<'info, EscrowAccount>>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow_account,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
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

    require!(escrow.status == EscrowStatus::Funded, FlowFiError::EscrowNotFunded);
    require!(escrow.milestone_approved, FlowFiError::MilestoneNotApproved);

    // Set status before CPI — prevents re-entrancy
    escrow.status = EscrowStatus::Released;

    let release_amount = ctx.accounts.vault.amount;

    if release_amount == 0 {
        // Advance consumed all funds — just mark Released
        msg!("FlowFi: vault empty after advance, marking Released");
        return Ok(());
    }

    // Build PDA signer seeds — must match account constraint seeds exactly
    let client_key = escrow.client;
    let invoice_id = escrow.dodo_invoice_id.clone();
    let bump = escrow.bump;
    let id_bytes = invoice_id.as_bytes();
    let id_slice = &id_bytes[..id_bytes.len().min(32)];

    let seeds: &[&[u8]] = &[b"escrow", client_key.as_ref(), id_slice, &[bump]];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.freelancer_usdc_account.to_account_info(),
                authority: escrow.to_account_info(),
            },
            &[seeds],
        ),
        release_amount,
        ctx.accounts.usdc_mint.decimals,
    )?;

    msg!(
        "FlowFi: funds released — invoice: {}, amount: {}, freelancer: {}",
        escrow.dodo_invoice_id, release_amount, escrow.freelancer,
    );
    Ok(())
}
