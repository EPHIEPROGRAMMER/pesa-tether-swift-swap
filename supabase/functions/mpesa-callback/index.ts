
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
      console.error('Invalid callback data structure');
      return new Response('Invalid callback data', { status: 400 });
    }

    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    console.log('Processing callback:', { CheckoutRequestID, ResultCode, ResultDesc });

    // Find transaction by checkout request ID
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID, fetchError);
      return new Response('Transaction not found', { status: 404 });
    }

    console.log('Found transaction:', transaction.id);

    if (ResultCode === 0) {
      // Payment successful
      console.log('Payment successful for transaction:', transaction.id);
      
      // Extract M-Pesa transaction details
      let mpesaTransactionId = null;
      let actualAmount = null;
      let phoneNumber = null;
      
      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        const items = stkCallback.CallbackMetadata.Item;
        
        const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
        const amountItem = items.find((item: any) => item.Name === 'Amount');
        const phoneItem = items.find((item: any) => item.Name === 'PhoneNumber');
        
        mpesaTransactionId = receiptItem?.Value;
        actualAmount = amountItem?.Value;
        phoneNumber = phoneItem?.Value;
        
        console.log('M-Pesa details:', { mpesaTransactionId, actualAmount, phoneNumber });
      }

      // Update transaction status to processing (payment confirmed, now preparing USDT transfer)
      const { error: updateError } = await supabaseClient
        .from('transactions')
        .update({
          status: 'processing',
          mpesa_transaction_id: mpesaTransactionId,
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw new Error('Failed to update transaction');
      }

      console.log('Transaction updated to processing, initiating USDT transfer...');

      // Initiate USDT transfer
      try {
        const usdtResponse = await supabaseClient.functions.invoke('send-usdt', {
          body: {
            transaction_id: transaction.id,
            wallet_address: transaction.usdt_wallet_address,
            amount: transaction.usdt_amount,
          },
        });

        if (usdtResponse.error) {
          console.error('USDT transfer failed:', usdtResponse.error);
          
          // Update transaction to failed
          await supabaseClient
            .from('transactions')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);
        } else {
          console.log('USDT transfer initiated successfully');
        }
      } catch (usdtError) {
        console.error('Error calling USDT function:', usdtError);
        
        // Update transaction to failed
        await supabaseClient
          .from('transactions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);
      }

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

    return new Response('Callback processed successfully', { 
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
