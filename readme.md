# FlowFi

## Get paid instantly. Not 30 days later.

FlowFi is a stablecoin-powered payment infrastructure platform built on Solana that helps freelancers and small businesses access their earnings immediately instead of waiting through traditional invoice cycles.

---

# The “Net-30” Trap: Why Global Work is Broken

Across the world, the biggest hurdle for the global freelance economy isn’t finding work — it’s accessing the money already earned.

Traditional payment infrastructure was never designed for an internet-native workforce operating across borders, currencies, and banking systems.

## The Problem: Fragmented, Slow, and Expensive

> The real issue isn’t invoicing.
> The real issue is settlement infrastructure.

Freelancers and small businesses are forced into a waiting game where capital stays trapped in outdated payment cycles long after work is completed.

This creates major friction across global work:

* Working capital gets locked behind Net-30 or Net-60 cycles
* Cross-border transfers remain slow and expensive
* Banking intermediaries introduce delays and payout uncertainty
* Freelancers face cash-flow pressure even after client approval
* Traditional escrow systems are either too centralized or too complex for mainstream users

Even when a client fully intends to pay, the delay itself becomes a tax on growth.

---

# Why FlowFi?

FlowFi transforms pending invoices into immediate usable liquidity.

By combining real-world payment rails with Solana stablecoin infrastructure, FlowFi reduces the gap between completing work and accessing earnings.

We’re building programmable settlement infrastructure for internet-native work.

---

# What Makes FlowFi Different

FlowFi is not:

* a freelance marketplace
* an invoicing app
* a traditional escrow platform

FlowFi is:

> a programmable payment and liquidity layer for trusted global work.

Clients pay using familiar methods like:

* cards
* bank transfers
* stablecoins

Behind the scenes:

* funds are converted into USDC
* escrow is created on Solana
* settlement becomes transparent and verifiable
* freelancers gain early access to secured earnings

No waiting for Net-30 payout cycles.

---

# Core Features

## Escrow-Backed Payments

Client funds are locked securely inside a Solana escrow smart contract before work begins.

This protects both parties:

* freelancers know funds are secured
* clients maintain approval control over final settlement

---

## Instant Liquidity (PayFi)

Once payment is secured, freelancers can instantly access up to:

# 85% of the payment immediately

without waiting weeks for invoice settlement.

This helps solve:

* delayed invoice cycles
* cross-border payout friction
* freelancer cash-flow pressure

---

## Stablecoin Infrastructure

FlowFi uses:

* Solana
* USDC
* programmable escrow settlement

To enable:

* near-instant settlement
* transparent verification
* low-cost global payments
* programmable payout logic

---

## Real-World Payouts

Freelancers can off-ramp earnings directly into local bank accounts using providers like Transak or other payment gateways.

This enables:

* INR withdrawals
* local fiat settlement
* real-world usability beyond crypto-native users

---

# Why Dodo Payments

Traditional crypto payment systems often force users into wallet-first experiences that create friction for mainstream adoption.

FlowFi uses Dodo Payments to bridge traditional payment methods with stablecoin settlement infrastructure on Solana.

This allows clients to:

* pay using familiar methods like UPI, cards, and bank transfers
* access global payment rails without crypto complexity
* settle payments into programmable on-chain escrow infrastructure

Dodo acts as the fiat payment orchestration layer, while Solana powers transparent escrow settlement and instant liquidity access for freelancers.

This combination enables a hybrid Web2-to-Web3 payment experience designed for real-world usability.

---

# Dodo Payments Integration

FlowFi is built specifically around the Dodo Payments ecosystem for the Solana Frontier Hackathon.

Dodo Payments powers:

* card payments
* bank transfer collection
* stablecoin checkout flows
* global payment acceptance
* fiat-to-stablecoin settlement infrastructure

This enables:

* familiar Web2 payment UX
* stablecoin-powered settlement on Solana
* faster cross-border payment infrastructure
* reduced friction for non-crypto-native users

Instead of forcing users into crypto-first workflows, FlowFi integrates stablecoins invisibly into real-world payment infrastructure.

---

# Architecture Overview

## Payment Flow

### 1. Client Creates Job

Client enters:

* freelancer details
* amount
* project information

---

### 2. Client Pays via Dodo Payments

Supported methods:

* cards
* bank transfers
* stablecoins

Currently, clients complete a lightweight wallet authorization step during escrow initialization.

FlowFi sponsors the gas fees, and future versions will fully abstract this interaction away.

---

### 3. Backend Settlement

After successful Dodo webhook confirmation:

* backend verifies payment
* backend initializes escrow on Solana
* backend funds escrow vault with USDC
* all settlement remains fully on-chain

---

### 4. Escrow Secured

Funds are now:

* transparent
* verifiable
* secured on-chain

---

### 5. Freelancer Gets Instant Access

Freelancer can withdraw:

* up to 85% instantly

without waiting for traditional payout cycles.

---

### 6. Final Settlement

Remaining funds are released:

* after approval
* or automatically after timeout conditions

---

# Technical Stack

## Frontend

* Next.js (App Router)
* Tailwind CSS
* Framer Motion

---

## Blockchain

* Solana
* Anchor Framework
* Rust

---

## Backend

* Node.js
* TypeScript
* Solana Web3.js
* Anchor Client

---

## Payments

* Dodo Payments
* Transak

---

# Smart Contract Features

* Escrow PDA architecture
* Vault-based USDC custody
* Milestone settlement support
* Automatic release logic
* Advance payout support
* Backend-sponsored settlement infrastructure

--- 

# Why Solana

FlowFi chose Solana because global payment infrastructure requires:

* speed
* low fees
* scalability
* real-time settlement

Solana enables:

* near-instant confirmations
* low-cost escrow operations
* scalable stablecoin infrastructure

This makes programmable finance practical for freelancers and SMBs globally.

---

# Deployment Information

## Program ID

`26KdmFpYTmAauE1JT3sUr1AbUeN6521tT7HWaZx8J2JJ`

---

## Transaction Signature

`38Avc8XtvGXfgRQCuJhFHbJW6LRhRHGZkEP8GPEn4opS3h5Lz3asgQdQ8pq2ULEYVZbuamLuNtjEj8fxZYL2vLQq`

---

# Project Structure

```bash
/contracts   → Solana Anchor Program
/dapp        → Next.js Frontend
/api         → Dodo Webhooks + Backend Settlement Logic
```

---

# Vision

FlowFi is building programmable settlement infrastructure for the future of global work.

We believe:

* payments should settle instantly
* liquidity should not remain locked behind invoice cycles
* freelancers should access earnings the moment work is secured

By combining:

* stablecoins
* escrow infrastructure
* programmable finance
* real-world payment rails

FlowFi turns delayed payments into instant usable capital.

---

Built for the Solana Frontier Hackathon.
Powered by Solana, stablecoins, and Dodo Payments.
