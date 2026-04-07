use anchor_lang::prelude::*;

#[error_code]
pub enum FlowFiError {

    /// The escrow must be in `Created` status for this operation.
    #[msg("Escrow must be in Created status")]
    EscrowNotCreated,

    /// The escrow must be in `Funded` status for this operation.
    #[msg("Escrow must be in Funded status")]
    EscrowNotFunded,

    /// The escrow is already funded; cannot fund twice (idempotency guard).
    #[msg("Escrow is already funded")]
    EscrowAlreadyFunded,

    /// Funds have already been released from this escrow.
    #[msg("Funds have already been released")]
    AlreadyReleased,

    /// The escrow has already been cancelled.
    #[msg("Escrow has already been cancelled")]
    AlreadyCancelled,

    
    /// Only the client stored on the escrow account can call this instruction.
    #[msg("Signer is not the escrow client")]
    UnauthorizedClient,

    /// Only the freelancer stored on the escrow account can call this instruction.
    #[msg("Signer is not the escrow freelancer")]
    UnauthorizedFreelancer,

    /// Only the designated backend authority can call this instruction.
    #[msg("Signer is not the backend authority")]
    UnauthorizedAuthority,

  
    /// An advance has already been issued for this escrow — cannot advance twice.
    #[msg("Advance has already been taken for this escrow")]
    AdvanceAlreadyTaken,

    /// Cannot cancel an escrow while an un-repaid advance is outstanding.
    #[msg("Cannot cancel: an active advance has not been repaid")]
    ActiveAdvanceNotRepaid,

    /// The advance has already been marked as repaid.
    #[msg("Advance has already been repaid")]
    AdvanceAlreadyRepaid,

  
    /// The client has not yet approved the milestone; release is blocked.
    #[msg("Milestone has not been approved by the client")]
    MilestoneNotApproved,

   
    /// Amount must be strictly greater than zero.
    #[msg("Amount must be greater than zero")]
    ZeroAmount,

    /// The dodo_invoice_id string exceeds the 64-character maximum.
    #[msg("Invoice ID exceeds maximum length of 64 characters")]
    InvoiceIdTooLong,

   
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
