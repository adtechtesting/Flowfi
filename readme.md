# FlowFi 

**"Get paid instantly. Not 30 days later."**

FlowFi is a production-grade freelancer payment platform that solves the cash-flow gap in global work. By combining trusted fiat payment rails with the speed of Solana, FlowFi allows freelancers to access their earnings the moment a client secures the funds—eliminating the standard net-30 wait times.

---

## 🌟 Key Features

- **Secured Payments**: Funds are locked in a Solana smart contract escrow before work begins. No more chasing invoices.
- **Instant Access (PayFi)**: Freelancers can withdraw up to **85% of their pay immediately** once funds are secured by the client.
- **Seamless Fiat In-ramp**: Clients pay using familiar methods (Cards, Bank Transfers) via **Dodo Payments**.
- **Instant Bank Off-ramp**: Freelancers can withdraw their USDC earnings directly to their local bank accounts (INR, etc.) via **Transak**.
- **Modern Infrastructure**: Powered by Solana for near-instant settlement and negligible transaction fees.

---

## 🛠 Technical Stack

- **Frontend**: Next.js (App Router), Framer Motion (for premium liquid-glass UI), Tailwind CSS.
- **Blockchain**: Solana (Anchor Framework / Rust).
- **Payment In-ramp**: [Dodo Payments](https://dodopayments.com) (Merchant of Record & Global Tax Compliance).
- **Off-ramp & Conversion**: [Transak SDK](https://transak.com) (USDC to Fiat / Local Bank).
- **Real-time Rates**: Custom pricing engine integration for transparent USDC-to-INR conversion previews.

---

## 🏗 How It Works

1. **Client Creates Job**: Client sets the project details and secures the payment.
2. **Fiat to Escrow**: Client pays in fiat via Dodo Payments. A backend webhook triggers the funding of a Solana Escrow contract.
3. **Funds Locked**: The USDC is held securely on-chain.
4. **Instant Advance**: The freelancer can immediately claim an advance (up to 85%) to maintain cash flow.
5. **Withdrawal**: Freelancers use the integrated Transak widget to off-ramp their USDC directly to their bank account in INR.
6. **Final Release**: The remaining 15% is released automatically upon project completion.

---

## 🚀 Deployment Information

**Program Id**: `26KdmFpYTmAauE1JT3sUr1AbUeN6521tT7HWaZx8J2JJ`

**Signature**: `38Avc8XtvGXfgRQCuJhFHbJW6LRhRHGZkEP8GPEn4opS3h5Lz3asgQdQ8pq2ULEYVZbuamLuNtjEj8fxZYL2vLQq`

---

## 📂 Project Structure

- `/contract`: Solana Anchor program (Rust).
- `/dapp`: Next.js web application.
- `/dapp/app/api`: Backend logic for Dodo webhooks and Transak sessions.

---

Built with ❤️ for the future of work.