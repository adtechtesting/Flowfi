use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::errors::FlowFiError;
use crate::state::{EscrowAccount, EscrowStatus};


#[derive(Accounts)]
pub struct CancelEscrow<'info> {
   
    #[account(mut)]
    pub client: Signer<'info>,

   
    pub usdc_mint: InterfaceAccount<'info, Mint>,

   
    #[account(
        mut,
        associated_token::mint      = usdc_mint,
        associated_token::authority = client,
        associated_token::token_program = token_program,
    )]
    pub client_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

 
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

  
    #[account(
        mut,
        associated_token::mint      = usdc_mint,
        associated_token::authority = escrow_account,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

   
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


pub fn cancel_escrow(ctx: Context<CancelEscrow>, advance_repaid: bool) -> Result<()> {
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
        require!(advance_repaid, FlowFiError::ActiveAdvanceNotRepaid);
    }

   
    escrow.status = EscrowStatus::Cancelled;

   
    let vault_balance = ctx.accounts.vault.amount;

    if vault_balance > 0 {
       
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
            to: ctx.accounts.client_usdc_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        transfer_checked(cpi_ctx, vault_balance, decimals)?;

        msg!(
            "FlowFi: cancel_escrow — refunded {} USDC units to client: {}",
            vault_balance,
            ctx.accounts.client.key(),
        );
    }


    {
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

        let close_accounts = CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.client.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            close_accounts,
            signer_seeds,
        );
        close_account(close_ctx)?;
    }

    msg!(
        "FlowFi: escrow cancelled — invoice: {}",
        escrow.dodo_invoice_id,
    );

    Ok(())
}
