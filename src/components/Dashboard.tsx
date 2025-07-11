import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, History, Settings, LogOut, User } from "lucide-react";
import { MpesaToUsdtForm } from "./MpesaToUsdtForm";
import { UsdtToMpesaForm } from "./UsdtToMpesaForm";
import { TransactionHistory } from "./TransactionHistory";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

export const Dashboard = ({ username }: DashboardProps) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };
  const [activeTab, setActiveTab] = useState("mpesa-to-usdt");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <ArrowLeftRight className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TetherPesa</h1>
                <p className="text-sm text-muted-foreground">Welcome, {username}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
              <TabsTrigger value="mpesa-to-usdt" className="flex items-center space-x-2">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">M-Pesa → USDT</span>
                <span className="sm:hidden">To USDT</span>
              </TabsTrigger>
              <TabsTrigger value="usdt-to-mpesa" className="flex items-center space-x-2">
                <ArrowLeftRight className="h-4 w-4 rotate-180" />
                <span className="hidden sm:inline">USDT → M-Pesa</span>
                <span className="sm:hidden">To M-Pesa</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="mpesa-to-usdt" className="animate-fade-in">
              <MpesaToUsdtForm />
            </TabsContent>

            <TabsContent value="usdt-to-mpesa" className="animate-fade-in">
              <UsdtToMpesaForm />
            </TabsContent>

            <TabsContent value="history" className="animate-fade-in">
              <TransactionHistory />
            </TabsContent>

            <TabsContent value="settings" className="animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Account Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your TetherPesa account preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Account Information</h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="font-medium">{username}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Quick Actions</h3>
                    <div className="grid gap-3">
                      <Button variant="outline" className="justify-start">
                        Change Password
                      </Button>
                      <Button variant="outline" className="justify-start">
                        Download Transaction History
                      </Button>
                      <Button variant="outline" className="justify-start">
                        Contact Support
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};