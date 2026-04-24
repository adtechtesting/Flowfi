import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, walletAddress } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;
    const apiSecret = process.env.TRANSAK_API_SECRET || "null"


    const tokenResponse = await fetch('https://api-stg.transak.com/partners/api/v2/refresh-token', {
      method: 'POST',
      headers: {
        'api-secret': apiSecret,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ apiKey })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || tokenData.message || 'Failed to generate Transak Access Token from Secret');
    }

    const accessToken = tokenData.data?.accessToken;

    if (!accessToken) throw new Error("No access token returned from Transak.");


    const response = await fetch('https://api-gateway-stg.transak.com/api/v2/auth/session', {
      method: 'POST',
      headers: {
        'access-token': accessToken,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey: apiKey,
          referrerDomain: "flowfi-test.com",
          cryptoCurrencyCode: 'USDC',
          network: 'solana',
          productsAvailed: 'SELL',
          cryptoAmount: amount,
          fiatCurrency: 'INR',
          walletAddress: walletAddress,
          exchangeScreenTitle: 'Withdraw to Bank'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Failed to create Transak session');
    }

    return NextResponse.json({ widgetUrl: data.data.widgetUrl });
  } catch (error: any) {
    console.error('Transak Session Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
