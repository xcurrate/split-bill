'use client';

import { ArrowRight, Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GroupCalculation } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SettlementViewProps {
  calculation: GroupCalculation;
}

export function SettlementView({ calculation }: SettlementViewProps) {
  const { balances, settlements, totalAmount } = calculation;

  const getBalanceIcon = (netBalance: number) => {
    if (netBalance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (netBalance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getBalanceColor = (netBalance: number) => {
    if (netBalance > 0) return 'text-green-600';
    if (netBalance < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getBalanceBg = (netBalance: number) => {
    if (netBalance > 0) return 'bg-green-50';
    if (netBalance < 0) return 'bg-red-50';
    return 'bg-muted';
  };

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <Card className="bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Semua Transaksi</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Balances */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saldo per Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada member
            </p>
          ) : (
            balances.map((balance) => (
              <div
                key={balance.memberId}
                className={`p-3 rounded-lg ${getBalanceBg(balance.netBalance)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBalanceIcon(balance.netBalance)}
                    <span className="font-medium">{balance.memberName}</span>
                  </div>
                  <span className={`font-semibold ${getBalanceColor(balance.netBalance)}`}>
                    {balance.netBalance >= 0 ? '+' : ''}{formatCurrency(balance.netBalance)}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Bayar: {formatCurrency(balance.paid)}</span>
                  <span>Patungan: {formatCurrency(balance.owes)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Settlements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💸 Settlement (Minim Transfer)</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-muted-foreground">
                {balances.length === 0 
                  ? 'Tambahkan member untuk melihat settlement' 
                  : 'Semua sudah seimbang! Tidak ada yang perlu transfer.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                {settlements.length} transfer untuk menyelesaikan semua:
              </p>
              {settlements.map((settlement, idx) => (
                <div
                  key={`${settlement.from}-${settlement.to}-${idx}`}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="secondary" className="font-medium">
                      {settlement.fromName}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="default" className="font-medium">
                      {settlement.toName}
                    </Badge>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatCurrency(settlement.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanation */}
      {settlements.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Positif (+)</strong> = Member ini harus menerima uang</p>
          <p>💡 <strong>Negatif (-)</strong> = Member ini harus membayar uang</p>
          <p>💡 Algoritma settlement meminimalkan jumlah transfer antar member</p>
        </div>
      )}
    </div>
  );
}
