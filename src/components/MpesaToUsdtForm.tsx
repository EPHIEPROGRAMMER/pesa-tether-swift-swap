import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Check, Edit, Loader2, Smartphone, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MpesaToUsdtForm = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [confirmAddress, setConfirmAddress] = useState("");
  const [isNumberConfirmed, setIsNumberConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mock exchange rate
  const exchangeRate = 0.0000065; // 1 KES = 0.0000065 USDT
  const usdtAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(6) : "0";

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
    
    // Simulate STK Push process
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Transaction Initiated",
        description: "Please check your phone for M-Pesa prompt",
      });
      
      // Simulate success after STK push
      setTimeout(() => {
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
      }, 3000);
    }, 1500);
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