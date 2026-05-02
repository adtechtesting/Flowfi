import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;

    const response = await fetch(`https://api-stg.transak.com/api/v2/currencies/price?partnerApiKey=${apiKey}&fiatCurrency=INR&cryptoCurrency=USDC&isBuyOrSell=SELL&paymentMethod=inr_bank_transfer&cryptoAmount=1`);

    if (!response.ok) {

      const fallback = await fetch("https://open.er-api.com/v6/latest/USD");
      const fallbackData = await fallback.json();
      return NextResponse.json({ rate: fallbackData.rates.INR, fee: 20 });
    }

    const data = await response.json();
    const fiatAmount = data?.response?.fiatAmount || 94.91;
    const totalFeeInFiat = data?.response?.totalFeeInFiat || 0;

    return NextResponse.json({ rate: fiatAmount + totalFeeInFiat, fee: totalFeeInFiat, exactFiat: fiatAmount });
  } catch (error) {
    return NextResponse.json({ rate: 94.91, fee: 20 });
  }
}
