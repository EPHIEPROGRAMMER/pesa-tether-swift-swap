import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { MpesaStkPushSimple } from "@/components/MpesaStkPushSimple";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, but show the welcome page instead of auto-redirecting
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Dashboard username={user.email || "User"} onLogout={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-4xl font-bold">M-Pesa STK Push Demo</h1>
          <p className="text-muted-foreground">
            Full-stack M-Pesa integration with React frontend and Supabase Edge Functions
          </p>
        </div>

        {/* M-Pesa STK Push Component */}
        <div className="flex justify-center">
          <MpesaStkPushSimple />
        </div>

        {/* Info Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🔹 Frontend (React):</h4>
              <p className="text-sm text-muted-foreground">
                Form accepts phoneNumber (2547XXXXXXXX) and amount (KES). 
                Sends POST to /api/stkpush endpoint with loading states and error handling.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔹 Backend (Supabase Edge Function):</h4>
              <p className="text-sm text-muted-foreground">
                Authenticates with Safaricom Daraja API, generates timestamp and password, 
                sends STK Push to https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔐 Credentials:</h4>
              <p className="text-sm text-muted-foreground">
                Using your provided M-Pesa credentials (hardcoded in edge function for demo)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auth Section */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Want to see more features?</CardTitle>
            <CardDescription>
              Sign in to access the full dashboard with transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full"
              variant="outline"
            >
              Sign In / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
