

use anchor_lang::prelude::*;


pub mod errors;
pub mod instructions;
pub mod state;


use instructions::*;


declare_id!("EZeiKFbrbUX72yMVPcyU5cKuavYXQNr5Wf3paavJeoNT");

#[program]
pub mod contract {
    use super::*;

       pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        dodo_invoice_id: String,
        amount: u64,
        freelancer: Pubkey,
    ) -> Result<()> {
        instructions::initialize_escrow::initialize_escrow(ctx, dodo_invoice_id, amount, freelancer)
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

        pub fn cancel_escrow(ctx: Context<CancelEscrow>, advance_repaid: bool) -> Result<()> {
        instructions::cancel_escrow::cancel_escrow(ctx, advance_repaid)
    }
}
