import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('M-Pesa callback received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const callbackData = await req.json();
    console.log('Callback data:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      throw new Error('Invalid callback data structure');
    }

    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find transaction by checkout request ID
    const { data: transaction } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (!transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID);
      return new Response('Transaction not found', { status: 404 });
    }

    console.log('Found transaction:', transaction.id);

    if (ResultCode === 0) {
      // Payment successful
      console.log('Payment successful for transaction:', transaction.id);
      
      // Extract M-Pesa transaction ID
      let mpesaTransactionId = null;
      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        const receiptItem = stkCallback.CallbackMetadata.Item.find(
          (item: any) => item.Name === 'MpesaReceiptNumber'
        );
        mpesaTransactionId = receiptItem?.Value;
      }

      // Update transaction status
      await supabaseClient
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_transaction_id: mpesaTransactionId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      console.log('Transaction updated to completed, initiating USDT transfer...');

      // Initiate USDT transfer
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-usdt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transaction.id,
          wallet_address: transaction.usdt_wallet_address,
          amount: transaction.usdt_amount,
        }),
      });

    } else {
      // Payment failed
      console.log('Payment failed for transaction:', transaction.id, 'Reason:', ResultDesc);
      
      await supabaseClient
        .from('transactions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);
    }

    return new Response('Callback processed', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return new Response('Error processing callback', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});