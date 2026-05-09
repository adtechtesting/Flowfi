import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, walletAddress } = await req.json();
    console.log('Initializing Transak Session:', { amount, walletAddress });

    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;
    const apiSecret = process.env.TRANSAK_API_SECRET;

    if (!apiKey) throw new Error("NEXT_PUBLIC_TRANSAK_API_KEY is missing");
    if (!apiSecret) throw new Error("TRANSAK_API_SECRET is missing");

    // 1. Get Access Token
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
      console.error('Transak Token Error:', tokenData);
      return NextResponse.json({ 
        error: `Token Error: ${tokenData.error?.message || tokenData.message || 'Unknown'}` 
      }, { status: tokenResponse.status });
    }

    const accessToken = tokenData.data?.accessToken;

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const origin = `${protocol}://${host}`;

    // 2. Create Session
    const sessionResponse = await fetch('https://api-gateway-stg.transak.com/api/v2/auth/session', {
      method: 'POST',
      headers: {
        'access-token': accessToken,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey: apiKey,
          productsAvailed: 'SELL',
          tradeType: 'SELL',
          isBuyOrSell: 'SELL',
          cryptoCurrencyCode: 'USDC',
          cryptoCurrency: 'USDC',
          fiatCurrency: 'INR',
          network: 'solana',
          cryptoAmount: amount,
          walletAddress: walletAddress,
          disableWalletAddressEdit: true,
          themeColor: '000000',
          exchangeScreenTitle: 'Withdraw to Bank',
          environment: 'STAGING',
          referrerDomain: origin,
          redirectURL: origin
        }
      })
    });

    const sessionData = await sessionResponse.json();
    if (!sessionResponse.ok) {
      console.error('Transak Session Error:', sessionData);
      return NextResponse.json({ 
        error: `Session Error: ${sessionData.error?.message || sessionData.message || 'Unknown'}` 
      }, { status: sessionResponse.status });
    }

    return NextResponse.json({ widgetUrl: sessionData.data.widgetUrl });

  } catch (error: any) {
    console.error('Internal Transak Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
