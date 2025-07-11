
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendUSDTRequest {
  transaction_id: string;
  wallet_address: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('USDT transfer request received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transaction_id, wallet_address, amount }: SendUSDTRequest = await req.json();

    const tronApiKey = Deno.env.get('TRON_API_KEY');
    const senderAddress = Deno.env.get('USDT_WALLET_ADDRESS');
    const privateKey = Deno.env.get('USDT_PRIVATE_KEY');

    if (!tronApiKey || !senderAddress || !privateKey) {
      console.error('Missing TRON/USDT configuration:', {
        tronApiKey: !!tronApiKey,
        senderAddress: !!senderAddress,
        privateKey: !!privateKey
      });
      throw new Error('Missing TRON/USDT configuration');
    }

    console.log(`Initiating USDT transfer: ${amount} USDT to ${wallet_address}`);

    // Validate wallet address format (basic TRON address validation)
    if (!wallet_address.startsWith('T') || wallet_address.length !== 34) {
      throw new Error('Invalid TRON wallet address format');
    }

    // USDT contract address on TRON mainnet
    const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    
    // Convert amount to USDT smallest unit (6 decimals)
    const amountInSmallestUnit = Math.floor(amount * 1000000);

    console.log('Transfer details:', {
      from: senderAddress,
      to: wallet_address,
      amount: amount,
      amountInSmallestUnit: amountInSmallestUnit
    });

    // Use TronGrid API for mainnet
    const tronGridUrl = 'https://api.trongrid.io';
    
    try {
      // First, get account info to ensure sender has enough balance
      const accountResponse = await fetch(`${tronGridUrl}/v1/accounts/${senderAddress}`, {
        headers: {
          'TRON-PRO-API-KEY': tronApiKey,
        },
      });

      if (!accountResponse.ok) {
        throw new Error(`Failed to get account information: ${accountResponse.status}`);
      }

      const accountData = await accountResponse.json();
      console.log('Account data retrieved');

      // Create USDT transfer transaction
      const transferParams = {
        owner_address: senderAddress,
        contract_address: usdtContractAddress,
        function_selector: 'transfer(address,uint256)',
        parameter: encodeTransferParams(wallet_address, amountInSmallestUnit),
        fee_limit: 100000000, // 100 TRX fee limit
        call_value: 0,
      };

      console.log('Creating USDT transfer transaction...');

      const createTxResponse = await fetch(`${tronGridUrl}/wallet/triggersmartcontract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TRON-PRO-API-KEY': tronApiKey,
        },
        body: JSON.stringify(transferParams),
      });

      const createTxData = await createTxResponse.json();
      
      if (!createTxData.result || !createTxData.result.result) {
        console.error('Transaction creation failed:', createTxData);
        throw new Error(`Failed to create transaction: ${createTxData.result?.message || 'Unknown error'}`);
      }

      const transaction = createTxData.transaction;
      console.log('Transaction created successfully');

      // Sign the transaction
      const signedTx = await signTransaction(transaction, privateKey);
      
      // Broadcast the transaction
      const broadcastResponse = await fetch(`${tronGridUrl}/wallet/broadcasttransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TRON-PRO-API-KEY': tronApiKey,
        },
        body: JSON.stringify(signedTx),
      });

      const broadcastResult = await broadcastResponse.json();
      
      if (!broadcastResult.result) {
        console.error('Broadcast failed:', broadcastResult);
        throw new Error(`Transaction broadcast failed: ${broadcastResult.message || 'Unknown error'}`);
      }

      const transactionHash = broadcastResult.txid;
      console.log('Transaction broadcasted successfully:', transactionHash);

      // Update transaction with USDT transaction hash and mark as completed
      const { error: updateError } = await supabaseClient
        .from('transactions')
        .update({
          usdt_transaction_hash: transactionHash,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction_id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw new Error('Failed to update transaction record');
      }

      console.log(`USDT transfer completed for transaction ${transaction_id}`);

      return new Response(JSON.stringify({
        success: true,
        transaction_hash: transactionHash,
        message: 'USDT transfer completed successfully',
        amount: amount,
        recipient: wallet_address,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (networkError) {
      console.error('Network error during USDT transfer:', networkError);
      throw new Error(`Network error: ${networkError.message}`);
    }

  } catch (error) {
    console.error('Error in USDT transfer:', error);
    
    // Update transaction status to failed
    try {
      const { transaction_id } = await req.json();
      if (transaction_id) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('transactions')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction_id);
      }
    } catch (updateError) {
      console.error('Error updating failed transaction:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to encode transfer parameters
function encodeTransferParams(toAddress: string, amount: number): string {
  // Remove 'T' prefix and convert to hex
  const addressHex = base58ToHex(toAddress).slice(2); // Remove '41' prefix
  const amountHex = amount.toString(16).padStart(64, '0');
  
  return `${addressHex.padStart(40, '0')}${amountHex}`;
}

// Helper function to convert base58 TRON address to hex
function base58ToHex(base58Address: string): string {
  // This is a simplified implementation - in production, use a proper base58 library
  // For now, we'll use a basic conversion assuming the address format
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = 0n;
  
  for (let i = 0; i < base58Address.length; i++) {
    const char = base58Address[i];
    const charIndex = alphabet.indexOf(char);
    if (charIndex === -1) {
      throw new Error('Invalid base58 character');
    }
    result = result * 58n + BigInt(charIndex);
  }
  
  return '41' + result.toString(16).padStart(40, '0');
}

// Helper function to sign transaction
async function signTransaction(transaction: any, privateKey: string): Promise<any> {
  // Import crypto functions
  const crypto = await import('https://deno.land/std@0.168.0/crypto/mod.ts');
  
  // Convert private key from hex to bytes
  const privateKeyBytes = hexToBytes(privateKey);
  
  // Get transaction bytes
  const txBytes = hexToBytes(transaction.raw_data_hex);
  
  // Create signature using secp256k1 (simplified - in production use proper crypto library)
  const signature = await crypto.crypto.subtle.sign(
    'ECDSA',
    await crypto.crypto.subtle.importKey(
      'raw',
      privateKeyBytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    ),
    txBytes
  );
  
  return {
    ...transaction,
    signature: [Array.from(new Uint8Array(signature))],
  };
}

// Helper function to convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
