import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, Shield, Zap } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", password: "", confirmPassword: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username && loginData.password) {
      onLogin(loginData.username);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.username && signupData.password && signupData.password === signupData.confirmPassword) {
      onLogin(signupData.username);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-primary p-3 rounded-full">
              <ArrowLeftRight className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">TetherPesa</h1>
          </div>
          <p className="text-muted-foreground">Fast, secure M-Pesa ↔ USDT exchange</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="bg-success/10 p-2 rounded-lg mx-auto w-fit">
              <Zap className="h-4 w-4 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">Instant</p>
          </div>
          <div className="space-y-2">
            <div className="bg-info/10 p-2 rounded-lg mx-auto w-fit">
              <Shield className="h-4 w-4 text-info" />
            </div>
            <p className="text-xs text-muted-foreground">Secure</p>
          </div>
          <div className="space-y-2">
            <div className="bg-warning/10 p-2 rounded-lg mx-auto w-fit">
              <ArrowLeftRight className="h-4 w-4 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground">Simple</p>
          </div>
        </div>

        {/* Login/Signup Forms */}
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Login to TetherPesa
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="text-center mb-4">
                  <CardDescription>
                    No email or KYC required. Just username and password.
                  </CardDescription>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={signupData.username}
                      onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};