import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StkPushResponse {
  success: boolean;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

export const MpesaStkPushSimple = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<StkPushResponse | null>(null);

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
      // Send POST request to /api/stkpush equivalent (Supabase Edge Function)
      const response = await fetch('/api/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResponse({
          success: true,
          checkoutRequestID: data.checkoutRequestID,
          merchantRequestID: data.merchantRequestID,
          responseDescription: data.responseDescription,
          customerMessage: data.customerMessage
        });
        
        toast({
          title: "STK Push Sent!",
          description: data.customerMessage || "Please check your phone for M-Pesa prompt",
        });
      } else {
        setResponse({
          success: false,
          error: data.error || 'Failed to send STK push'
        });
        
        toast({
          title: "STK Push Failed",
          description: data.error || "Failed to send STK push. Please try again.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('STK Push error:', error);
      setResponse({
        success: false,
        error: error.message || 'Network error occurred'
      });
      
      toast({
        title: "Error",
        description: error.message || "Network error occurred. Please try again.",
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
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <span>M-Pesa STK Push</span>
          </CardTitle>
          <CardDescription>
            Send M-Pesa payment request
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
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-green-800">STK Push Sent Successfully!</p>
                      {response.checkoutRequestID && (
                        <p className="text-sm text-green-700">
                          <strong>Checkout Request ID:</strong> {response.checkoutRequestID}
                        </p>
                      )}
                      {response.merchantRequestID && (
                        <p className="text-sm text-green-700">
                          <strong>Merchant Request ID:</strong> {response.merchantRequestID}
                        </p>
                      )}
                      {response.responseDescription && (
                        <p className="text-sm text-green-700">
                          <strong>Description:</strong> {response.responseDescription}
                        </p>
                      )}
                      {response.customerMessage && (
                        <p className="text-sm text-green-700">
                          {response.customerMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">STK Push Failed</p>
                      <p className="text-sm text-red-700">{response.error}</p>
                    </div>
                  </div>
                </div>
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
    </div>
  );
};