import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Check, Edit, Loader2, Smartphone, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const MpesaToUsdtForm = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [confirmAddress, setConfirmAddress] = useState("");
  const [isNumberConfirmed, setIsNumberConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.0000065);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  const usdtAmount = amount ? (parseFloat(amount) / (exchangeRate * 1000000)).toFixed(6) : "0";

  // Fetch current exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const { data } = await supabase
          .from('exchange_rates')
          .select('rate')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    fetchExchangeRate();
  }, []);

  const handleConfirmNumber = () => {
    if (mpesaNumber.length >= 10) {
      setIsNumberConfirmed(true);
      toast({
        title: "Number confirmed",
        description: "M-Pesa number has been locked for this transaction"
      });
    }
  };

  const handleTransaction = async () => {
    if (!amount || !mpesaNumber || !usdtAddress || usdtAddress !== confirmAddress) {
      toast({
        title: "Error",
        description: "Please fill all fields and ensure wallet addresses match",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with the transaction",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Call STK Push function
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          amount: parseFloat(amount),
          phone_number: mpesaNumber,
          usdt_wallet_address: usdtAddress,
          user_id: user.id,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setTransactionId(data.transaction_id);
        toast({
          title: "STK Push Sent!",
          description: "Please check your phone for M-Pesa prompt",
        });

        // Start polling for transaction status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await supabase.functions.invoke('get-transaction-status', {
              body: {
                transaction_id: data.transaction_id,
                user_id: user.id,
              },
            });

            if (statusResponse.data?.transaction) {
              const transaction = statusResponse.data.transaction;
              
              if (transaction.status === 'completed') {
                clearInterval(pollInterval);
                setIsProcessing(false);
                toast({
                  title: "USDT Sent Successfully!",
                  description: `${usdtAmount} USDT has been sent to your wallet`,
                });
                
                // Reset form
                setAmount("");
                setMpesaNumber("");
                setUsdtAddress("");
                setConfirmAddress("");
                setIsNumberConfirmed(false);
                setTransactionId(null);
                
              } else if (transaction.status === 'failed') {
                clearInterval(pollInterval);
                setIsProcessing(false);
                toast({
                  title: "Transaction Failed",
                  description: "The M-Pesa payment was not completed. Please try again.",
                  variant: "destructive"
                });
                setTransactionId(null);
              }
            }
          } catch (statusError) {
            console.error('Error checking transaction status:', statusError);
          }
        }, 3000);

        // Clear interval after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isProcessing) {
            setIsProcessing(false);
            toast({
              title: "Transaction Timeout",
              description: "Transaction is taking longer than expected. Please check your transaction history.",
              variant: "destructive"
            });
          }
        }, 300000);

      } else {
        throw new Error(data.error || 'Failed to initiate transaction');
      }

    } catch (error) {
      console.error('Transaction error:', error);
      setIsProcessing(false);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to initiate transaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-success" />
          <span>M-Pesa to USDT</span>
        </CardTitle>
        <CardDescription>
          Send M-Pesa and receive USDT instantly in your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount in KES"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>
          
          {amount && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">You will receive</p>
                <p className="text-2xl font-bold text-primary">{usdtAmount} USDT</p>
                <p className="text-xs text-muted-foreground">Rate: 1 KES = {exchangeRate} USDT</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* M-Pesa Number Section */}
        <div className="space-y-2">
          <Label htmlFor="mpesa-number">M-Pesa Number</Label>
          <div className="flex space-x-2">
            <Input
              id="mpesa-number"
              type="tel"
              placeholder="0712345678"
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value)}
              disabled={isNumberConfirmed}
              className="flex-1"
            />
            <Button
              onClick={isNumberConfirmed ? () => setIsNumberConfirmed(false) : handleConfirmNumber}
              variant={isNumberConfirmed ? "outline" : "default"}
              className="whitespace-nowrap"
            >
              {isNumberConfirmed ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
          {isNumberConfirmed && (
            <p className="text-sm text-success flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Number confirmed and locked
            </p>
          )}
        </div>

        <Separator />

        {/* USDT Wallet Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usdt-address">USDT Wallet Address (TRC20)</Label>
            <Input
              id="usdt-address"
              type="text"
              placeholder="TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"
              value={usdtAddress}
              onChange={(e) => setUsdtAddress(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-address">Confirm USDT Wallet Address</Label>
            <Input
              id="confirm-address"
              type="text"
              placeholder="Confirm your USDT address"
              value={confirmAddress}
              onChange={(e) => setConfirmAddress(e.target.value)}
              className="font-mono text-sm"
            />
            {confirmAddress && (
              <p className={`text-sm flex items-center ${
                usdtAddress === confirmAddress ? 'text-success' : 'text-destructive'
              }`}>
                {usdtAddress === confirmAddress ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Addresses match
                  </>
                ) : (
                  "Addresses do not match"
                )}
              </p>
            )}
          </div>
        </div>

        {/* Transaction Button */}
        <Button
          onClick={handleTransaction}
          disabled={!amount || !isNumberConfirmed || !usdtAddress || usdtAddress !== confirmAddress || isProcessing}
          className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing Transaction...
            </>
          ) : (
            <>
              <Wallet className="h-5 w-5 mr-2" />
              Send M-Pesa & Receive USDT
            </>
          )}
        </Button>

        {/* Info */}
        <div className="bg-info/10 p-4 rounded-lg">
          <p className="text-sm text-info-foreground">
            <strong>How it works:</strong> After clicking "Transact", you'll receive an M-Pesa STK push on your phone. 
            Complete the payment and USDT will be sent to your wallet within 1-2 minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};