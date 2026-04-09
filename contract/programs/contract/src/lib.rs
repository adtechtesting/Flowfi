use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("26KdmFpYTmAauE1JT3sUr1AbUeN6521tT7HWaZx8J2JJ");

#[program]
pub mod flowfi_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        dodo_invoice_id: String,
        amount: u64,
        freelancer: Pubkey,
        authority: Pubkey,
    ) -> Result<()> {
        instructions::initialize_escrow::initialize_escrow(ctx, dodo_invoice_id, amount, freelancer, authority)
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        instructions::fund_escrow::fund_escrow(ctx)
    }

    pub fn approve_milestone(ctx: Context<ApproveMilestone>) -> Result<()> {
        instructions::approve_milestone::approve_milestone(ctx)
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        instructions::release_funds::release_funds(ctx)
    }

    pub fn request_advance(ctx: Context<RequestAdvance>) -> Result<()> {
        instructions::request_advance::request_advance(ctx)
    }

    pub fn repay_advance(ctx: Context<RepayAdvance>) -> Result<()> {
        instructions::repay_advance::repay_advance(ctx)
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        instructions::cancel_escrow::cancel_escrow(ctx)
    }
}