import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowDown, Copy, Wallet, Smartphone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const UsdtToMpesaForm = () => {
  const { toast } = useToast();
  const [usdtAmount, setUsdtAmount] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Mock exchange rate
  const exchangeRate = 153800; // 1 USDT = 153,800 KES
  const kesAmount = usdtAmount ? (parseFloat(usdtAmount) * exchangeRate).toLocaleString() : "0";
  
  // Mock USDT deposit address
  const depositAddress = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast({
      title: "Address copied",
      description: "USDT address has been copied to clipboard"
    });
  };

  const handleProceed = () => {
    if (!usdtAmount || !mpesaNumber) {
      toast({
        title: "Error",
        description: "Please enter both USDT amount and M-Pesa number",
        variant: "destructive"
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-warning" />
            <span>USDT to M-Pesa</span>
          </CardTitle>
          <CardDescription>
            Send USDT and receive M-Pesa instantly to your phone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usdt-amount">Amount (USDT)</Label>
              <Input
                id="usdt-amount"
                type="number"
                step="0.000001"
                placeholder="Enter amount in USDT"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            
            {usdtAmount && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">You will receive</p>
                  <p className="text-2xl font-bold text-success">KES {kesAmount}</p>
                  <p className="text-xs text-muted-foreground">Rate: 1 USDT = {exchangeRate.toLocaleString()} KES</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* M-Pesa Number Section */}
          <div className="space-y-2">
            <Label htmlFor="receive-mpesa-number">M-Pesa Number (to receive funds)</Label>
            <Input
              id="receive-mpesa-number"
              type="tel"
              placeholder="0712345678"
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Enter the M-Pesa number where you want to receive the money
            </p>
          </div>

          {/* Proceed Button */}
          <Button
            onClick={handleProceed}
            disabled={!usdtAmount || !mpesaNumber}
            className="w-full bg-warning hover:bg-warning/90 text-lg py-6"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Proceed to USDT Payment
          </Button>

          {/* Info */}
          <div className="bg-warning/10 p-4 rounded-lg">
            <p className="text-sm text-warning-foreground">
              <strong>How it works:</strong> Click "Proceed" to see the USDT deposit address. 
              Send the exact amount to that address and M-Pesa will be sent to your number within 5 minutes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send USDT Payment</DialogTitle>
            <DialogDescription>
              Send exactly {usdtAmount} USDT to the address below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Send exactly</p>
              <p className="text-xl font-bold text-primary">{usdtAmount} USDT</p>
              <p className="text-sm text-muted-foreground">TRC20 Network</p>
            </div>

            {/* Deposit Address */}
            <div className="space-y-2">
              <Label>USDT Deposit Address (TRC20)</Label>
              <div className="flex space-x-2">
                <Input
                  value={depositAddress}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  onClick={handleCopyAddress}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Receive Details */}
            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-sm text-success-foreground">
                <strong>M-Pesa Number:</strong> {mpesaNumber}
              </p>
              <p className="text-sm text-success-foreground">
                <strong>Amount to receive:</strong> KES {kesAmount}
              </p>
            </div>

            {/* Warning */}
            <div className="bg-destructive/10 p-4 rounded-lg flex space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Important:</p>
                <ul className="text-xs text-destructive space-y-1">
                  <li>• Send the exact amount shown above</li>
                  <li>• Use TRC20 network only</li>
                  <li>• M-Pesa will be sent within 5 minutes</li>
                  <li>• Do not close this dialog until payment is sent</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => setShowPaymentDialog(false)}
              className="w-full"
              variant="outline"
            >
              I have sent the USDT
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};