use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, close_account, transfer_checked, CloseAccount, TransferChecked},
};
use crate::state::{AdvanceAccount, EscrowAccount, id_seed, EscrowStatus};
use crate::errors::FlowFiError;

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub client: Signer<'info>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = client,
        associated_token::token_program = token_program,
    )]
    pub client_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

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

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = escrow_account,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

   
    pub advance_account: Option<Box<Account<'info, AdvanceAccount>>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

  
    require!(
        escrow.status == EscrowStatus::Created || escrow.status == EscrowStatus::Funded,
        if escrow.status == EscrowStatus::Released {
            FlowFiError::AlreadyReleased
        } else {
            FlowFiError::AlreadyCancelled
        }
    );

   
    if escrow.advanced {
        match &ctx.accounts.advance_account {
            Some(adv) => require!(adv.repaid, FlowFiError::ActiveAdvanceNotRepaid),
            None => return err!(FlowFiError::ActiveAdvanceNotRepaid),
        }
    }

    escrow.status = EscrowStatus::Cancelled;

    let vault_balance = ctx.accounts.vault.amount;

    
    let client_key = escrow.client;
    let invoice_id = escrow.dodo_invoice_id.clone();
    let bump = escrow.bump;
    let id_bytes = invoice_id.as_bytes();
    let id_slice = &id_bytes[..id_bytes.len().min(32)];

    let seeds: &[&[u8]] = &[b"escrow", client_key.as_ref(), id_slice, &[bump]];

    
    if vault_balance > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.usdc_mint.to_account_info(),
                    to: ctx.accounts.client_usdc_account.to_account_info(),
                    authority: escrow.to_account_info(),
                },
                &[seeds],
            ),
            vault_balance,
            ctx.accounts.usdc_mint.decimals,
        )?;

        msg!(
            "FlowFi: cancel_escrow — refunded {} USDC to client: {}",
            vault_balance, ctx.accounts.client.key(),
        );
    }

    // Close vault token account — returns rent lamports to client
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.client.to_account_info(),
            authority: escrow.to_account_info(),
        },
        &[seeds],
    ))?;

    msg!("FlowFi: escrow cancelled — invoice: {}", escrow.dodo_invoice_id);
    Ok(())
}
