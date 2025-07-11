import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  amount: number;
  phone_number: string;
  usdt_wallet_address: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('STK Push request received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { amount, phone_number, usdt_wallet_address, user_id }: STKPushRequest = await req.json();

    // Get M-Pesa access token
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const businessShortCode = Deno.env.get('MPESA_BUSINESS_SHORT_CODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      throw new Error('Missing M-Pesa configuration');
    }

    console.log('Getting M-Pesa access token...');
    
    // Get access token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Access token obtained, initiating STK Push...');

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    
    // Generate password
    const password = btoa(`${businessShortCode}${passkey}${timestamp}`);

    // Format phone number (ensure it starts with 254)
    let formattedPhone = phone_number;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Get current exchange rate
    const { data: exchangeRate } = await supabaseClient
      .from('exchange_rates')
      .select('rate')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentRate = exchangeRate?.rate || 153800;
    const usdtAmount = amount / currentRate;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id,
        transaction_type: 'mpesa_to_usdt',
        status: 'pending',
        kes_amount: amount,
        usdt_amount: usdtAmount,
        exchange_rate: currentRate,
        mpesa_phone_number: formattedPhone,
        usdt_wallet_address,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    console.log('Transaction created:', transaction.id);

    // STK Push request
    const stkPushData = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: transaction.id,
      TransactionDesc: `USDT Purchase - ${usdtAmount.toFixed(6)} USDT`,
    };

    console.log('STK Push payload:', { ...stkPushData, Password: '[HIDDEN]' });

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    });

    const stkData = await stkResponse.json();
    console.log('STK Push response:', stkData);

    if (stkData.ResponseCode === '0') {
      // Update transaction with checkout request ID
      await supabaseClient
        .from('transactions')
        .update({ 
          checkout_request_id: stkData.CheckoutRequestID,
          status: 'processing'
        })
        .eq('id', transaction.id);

      return new Response(JSON.stringify({
        success: true,
        message: 'STK Push sent successfully',
        transaction_id: transaction.id,
        checkout_request_id: stkData.CheckoutRequestID,
        usdt_amount: usdtAmount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Update transaction status to failed
      await supabaseClient
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      throw new Error(`STK Push failed: ${stkData.ResponseDescription || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Error in STK Push:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});