use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, transfer_checked, TransferChecked},
};
use crate::state::{EscrowAccount, id_seed, EscrowStatus};
use crate::errors::FlowFiError;

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    /// CHECK: verified via constraint against escrow_account.authority
    #[account(mut)]
    pub authority: Signer<'info>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program,
    )]
    pub authority_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.client.as_ref(),
            id_seed(&escrow_account.dodo_invoice_id),
        ],
        bump = escrow_account.bump,
        // Only the stored authority can fund
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

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

    // Idempotency guard — Dodo may fire webhook more than once
    if escrow.status == EscrowStatus::Funded {
        msg!("FlowFi: fund_escrow — already funded, skipping (idempotent)");
        return Ok(());
    }

    require!(escrow.status == EscrowStatus::Created, FlowFiError::EscrowNotCreated);

    let amount = escrow.amount;
    let decimals = ctx.accounts.usdc_mint.decimals;

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.authority_usdc_account.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
        decimals,
    )?;

    escrow.status = EscrowStatus::Funded;
    msg!("FlowFi: escrow funded — invoice: {}, amount: {}", escrow.dodo_invoice_id, amount);
    Ok(())
}