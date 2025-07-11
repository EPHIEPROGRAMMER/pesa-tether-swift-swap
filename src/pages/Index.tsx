import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to CryptoExchange</CardTitle>
          <CardDescription>
            Your trusted platform for M-Pesa to USDT transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Please sign in to access your dashboard and start trading.
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            className="w-full"
          >
            Sign In / Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
