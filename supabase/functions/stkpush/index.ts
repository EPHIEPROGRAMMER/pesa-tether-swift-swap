import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('STK Push request received');
    
    const { phoneNumber, amount }: STKPushRequest = await req.json();

    // Validate input
    if (!phoneNumber || !amount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone number and amount are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount < 1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Minimum amount is KES 1'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // M-Pesa credentials
    const CONSUMER_KEY = "Vov3C60UiQcTlyK2QQFLVtZt6GdTOjr8trbANDURMiHUTc7A";
    const CONSUMER_SECRET = "YKOe82XJmOj6dDZhfUY6lGQJprYu6un6ssyfuj11zKymWs7EX0jPTie7MhfnkQvG";
    const MPESA_SHORTCODE = "4123113";
    const MPESA_PASSKEY = "e64631aec493cbaad76cab86daf8f4945d455930f2692054995a1478d865f7f6";
    const CALLBACK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    console.log('Using M-Pesa credentials for authentication...');

    // Step 1: Get access token via Safaricom OAuth endpoint
    const authString = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    
    const tokenResponse = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Failed to get access token:', tokenResponse.status, tokenError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to authenticate with M-Pesa API'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received:', tokenData);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to get M-Pesa access token'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Access token obtained successfully');

    // Step 2: Generate timestamp in yyyyMMddHHmmss format
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    console.log('Generated timestamp:', timestamp);

    // Step 3: Generate password = base64(shortcode + passkey + timestamp)
    const passwordString = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
    const password = btoa(passwordString);

    console.log('Password generated for STK Push');

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\s+/g, ''); // Remove spaces
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    console.log('Formatted phone number:', formattedPhone);

    // Step 4: Send STK Push request to Safaricom
    const stkPushData = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: `STK_${timestamp}`,
      TransactionDesc: `Payment of KES ${amount}`,
    };

    console.log('Sending STK Push request to Safaricom...');
    console.log('STK Push payload:', { 
      ...stkPushData, 
      Password: '[HIDDEN]',
      CallBackURL: CALLBACK_URL 
    });

    const stkResponse = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    });

    const stkData = await stkResponse.json();
    console.log('STK Push response from Safaricom:', stkData);

    // Step 5: Handle response and return to frontend
    if (stkData.ResponseCode === '0') {
      // Success
      console.log('STK Push successful');
      
      return new Response(JSON.stringify({
        success: true,
        checkoutRequestID: stkData.CheckoutRequestID,
        merchantRequestID: stkData.MerchantRequestID,
        responseDescription: stkData.ResponseDescription,
        customerMessage: stkData.CustomerMessage,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Error from Safaricom
      console.error('STK Push failed:', stkData);
      
      return new Response(JSON.stringify({
        success: false,
        error: stkData.ResponseDescription || stkData.errorMessage || 'STK Push failed',
        responseCode: stkData.ResponseCode,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in STK Push function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});