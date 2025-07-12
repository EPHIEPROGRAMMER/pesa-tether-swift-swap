import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StkResponse {
  success: boolean;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

export const MpesaStkPush = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<StkResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !amount) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    // Validate amount
    const numAmount = parseInt(amount);
    if (numAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is KES 1",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number format (should be 2547XXXXXXXX)
    const phoneRegex = /^254[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number in format 2547XXXXXXXX",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Call STK Push function
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          amount: numAmount,
          phone_number: phoneNumber,
          usdt_wallet_address: "THgP8iSjQ4iYRMvRaiLCS3inrLirxU4V8n", // Dummy address for STK push only
          user_id: user.id,
        },
      });

      if (error) {
        console.error('STK Push error:', error);
        throw new Error(error.message || 'Failed to initiate STK push');
      }

      if (data.success) {
        setResponse({
          success: true,
          checkoutRequestID: data.checkout_request_id,
          merchantRequestID: data.merchant_request_id,
          responseDescription: data.response_description || data.customerMessage,
          customerMessage: data.customerMessage
        });
        
        toast({
          title: "STK Push Sent!",
          description: data.customerMessage || "Please check your phone for M-Pesa prompt",
        });
      } else {
        setResponse({
          success: false,
          error: data.error || 'Failed to initiate STK push'
        });
        
        toast({
          title: "STK Push Failed",
          description: data.error || "Failed to initiate STK push. Please try again.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('STK Push error:', error);
      setResponse({
        success: false,
        error: error.message || 'Failed to initiate STK push'
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to initiate STK push. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setAmount("");
    setResponse(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <span>M-Pesa STK Push</span>
        </CardTitle>
        <CardDescription>
          Initiate M-Pesa payment request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="2547XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Format: 2547XXXXXXXX (include country code)
            </p>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              min="1"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!phoneNumber || !amount || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending STK Push...
              </>
            ) : (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                Send STK Push
              </>
            )}
          </Button>
        </form>

        {/* Response Display */}
        {response && (
          <div className="mt-6 space-y-4">
            {response.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">STK Push Sent Successfully!</p>
                    {response.checkoutRequestID && (
                      <p><strong>Checkout Request ID:</strong> {response.checkoutRequestID}</p>
                    )}
                    {response.merchantRequestID && (
                      <p><strong>Merchant Request ID:</strong> {response.merchantRequestID}</p>
                    )}
                    {response.responseDescription && (
                      <p><strong>Description:</strong> {response.responseDescription}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">STK Push Failed</p>
                  <p>{response.error}</p>
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={resetForm} 
              variant="outline" 
              className="w-full"
            >
              Send Another STK Push
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};