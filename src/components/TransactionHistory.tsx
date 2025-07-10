import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, ArrowLeftRight, Smartphone, Wallet } from "lucide-react";

interface Transaction {
  id: string;
  type: "mpesa-to-usdt" | "usdt-to-mpesa";
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed";
  date: string;
  exchangeRate: string;
}

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    id: "TXN001",
    type: "mpesa-to-usdt",
    amount: "15,000",
    currency: "KES",
    status: "completed",
    date: "2024-01-15 14:30",
    exchangeRate: "0.0000065"
  },
  {
    id: "TXN002",
    type: "usdt-to-mpesa",
    amount: "50",
    currency: "USDT",
    status: "completed",
    date: "2024-01-14 09:15",
    exchangeRate: "153,800"
  },
  {
    id: "TXN003",
    type: "mpesa-to-usdt",
    amount: "5,000",
    currency: "KES",
    status: "pending",
    date: "2024-01-14 16:45",
    exchangeRate: "0.0000065"
  },
  {
    id: "TXN004",
    type: "usdt-to-mpesa",
    amount: "25",
    currency: "USDT",
    status: "failed",
    date: "2024-01-13 11:20",
    exchangeRate: "153,800"
  },
  {
    id: "TXN005",
    type: "mpesa-to-usdt",
    amount: "30,000",
    currency: "KES",
    status: "completed",
    date: "2024-01-12 13:10",
    exchangeRate: "0.0000065"
  }
];

const getStatusBadge = (status: Transaction["status"]) => {
  switch (status) {
    case "completed":
      return <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>;
    case "failed":
      return <Badge variant="secondary" className="bg-destructive/10 text-destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getTransactionIcon = (type: Transaction["type"]) => {
  return type === "mpesa-to-usdt" ? (
    <div className="flex items-center space-x-1">
      <Smartphone className="h-4 w-4 text-success" />
      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
      <Wallet className="h-4 w-4 text-warning" />
    </div>
  ) : (
    <div className="flex items-center space-x-1">
      <Wallet className="h-4 w-4 text-warning" />
      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
      <Smartphone className="h-4 w-4 text-success" />
    </div>
  );
};

const getTransactionLabel = (type: Transaction["type"]) => {
  return type === "mpesa-to-usdt" ? "M-Pesa → USDT" : "USDT → M-Pesa";
};

export const TransactionHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Transaction History</span>
        </CardTitle>
        <CardDescription>
          View all your M-Pesa ↔ USDT exchange transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mockTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No transactions yet</h3>
            <p className="text-muted-foreground">
              Your transaction history will appear here once you make your first exchange.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="text-sm">{getTransactionLabel(transaction.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.amount} {transaction.currency}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.type === "mpesa-to-usdt" 
                          ? `1 KES = ${transaction.exchangeRate} USDT`
                          : `1 USDT = ${transaction.exchangeRate} KES`
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {mockTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="font-medium text-sm">{getTransactionLabel(transaction.type)}</span>
                      </div>
                      {getStatusBadge(transaction.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Amount:</span>
                        <span className="font-medium">{transaction.amount} {transaction.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rate:</span>
                        <span className="text-sm">
                          {transaction.type === "mpesa-to-usdt" 
                            ? `1 KES = ${transaction.exchangeRate} USDT`
                            : `1 USDT = ${transaction.exchangeRate} KES`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <span className="text-sm">{transaction.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">ID:</span>
                        <span className="font-mono text-xs">{transaction.id}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};