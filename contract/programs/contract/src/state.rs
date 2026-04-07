use anchor_lang::prelude::*;


#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
   
    Created,
   
    Funded,
    
    Released,
   
    Cancelled,
}


#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    
    pub client: Pubkey, 

    
    pub freelancer: Pubkey, 

   
    pub amount: u64, 

   
    #[max_len(32)]
    pub dodo_invoice_id: String,

    
    pub status: EscrowStatus, 

    
    pub advanced: bool, 

    
    pub advance_amount: u64, 

    
    pub milestone_approved: bool, 

   
    pub bump: u8, 

   
    pub vault_bump: u8, 

  
    pub created_at: i64, 
   
}


#[account]
#[derive(InitSpace)]
pub struct AdvanceAccount {
   
    pub escrow: Pubkey, 

  
    pub advance_amount: u64, 

    
    pub repaid: bool, 

    
    pub timestamp: i64, 


    pub bump: u8, 
                 
}
