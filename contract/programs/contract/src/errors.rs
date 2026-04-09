use anchor_lang::prelude::*;

#[error_code]
pub enum FlowFiError {
    #[msg("Escrow must be in Created status")]
    EscrowNotCreated,
    #[msg("Escrow must be in Funded status")]
    EscrowNotFunded,
    #[msg("Funds have already been released")]
    AlreadyReleased,
    #[msg("Escrow has already been cancelled")]
    AlreadyCancelled,
    #[msg("Signer is not the escrow client")]
    UnauthorizedClient,
    #[msg("Signer is not the escrow freelancer")]
    UnauthorizedFreelancer,
    #[msg("Signer is not the backend authority")]
    UnauthorizedAuthority,
    #[msg("Advance has already been taken for this escrow")]
    AdvanceAlreadyTaken,
    #[msg("Cannot cancel: an active advance has not been repaid")]
    ActiveAdvanceNotRepaid,
    #[msg("Advance has already been repaid")]
    AdvanceAlreadyRepaid,
    #[msg("Milestone has not been approved by the client")]
    MilestoneNotApproved,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Invoice ID exceeds maximum length of 32 characters")]
    InvoiceIdTooLong,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}