'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Users, Plus, Trash2, Edit2, Receipt, Calculator, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Group, Member, Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculateGroup, generateShareText } from '@/lib/calculations';
import { TransactionForm } from './TransactionForm';
import { SettlementView } from './SettlementView';
import { toast } from '@/components/ui/use-toast';

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  onUpdateGroup: (id: string, updates: Partial<Group>) => void;
  onAddMember: (groupId: string, name: string) => void;
  onUpdateMember: (groupId: string, memberId: string, name: string) => void;
  onDeleteMember: (groupId: string, memberId: string) => void;
  onAddTransaction: (groupId: string, transaction: Omit<Transaction, 'id' | 'date'>) => void;
  onUpdateTransaction: (groupId: string, transactionId: string, updates: Partial<Transaction>) => void;
  onDeleteTransaction: (groupId: string, transactionId: string) => void;
}

export function GroupDetail({
  group,
  onBack,
  onUpdateGroup,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: GroupDetailProps) {
  const [activeTab, setActiveTab] = useState('transactions');
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);

  const calculation = useMemo(() => calculateGroup(group), [group]);

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(group.id, newMemberName.trim());
      setNewMemberName('');
      setIsMemberDialogOpen(false);
    }
  };

  const handleUpdateMember = () => {
    if (editingMember && editingMember.name.trim()) {
      onUpdateMember(group.id, editingMember.id, editingMember.name.trim());
      setEditingMember(null);
    }
  };

  const handleShare = async () => {
    const text = generateShareText(group, calculation);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Berhasil!',
        description: 'Ringkasan telah disalin ke clipboard',
      });
    } catch {
      toast({
        title: 'Gagal',
        description: 'Tidak dapat menyalin ke clipboard',
        variant: 'destructive',
      });
    }
  };

  const getTransactionTotal = (transaction: Transaction) => {
    const itemsTotal = transaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountsTotal = transaction.discounts.reduce((sum, d) => {
      if (d.type === 'percentage') {
        return sum + (itemsTotal * d.value / 100);
      }
      return sum + d.value;
    }, 0);
    return itemsTotal - discountsTotal + transaction.tax + transaction.serviceCharge;
  };

  const getPayerName = (payerId: string) => {
    return group.members.find(m => m.id === payerId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(calculation.totalAmount)} total
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">
            <Receipt className="h-4 w-4 mr-2" />
            Transaksi
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Member
          </TabsTrigger>
          <TabsTrigger value="settlement">
            <Calculator className="h-4 w-4 mr-2" />
            Settlement
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {group.transactions.length} transaksi
            </p>
            <Button onClick={() => setIsTransactionDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Transaksi
            </Button>
          </div>

          {group.transactions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center">
                  Belum ada transaksi.<br />
                  Tambahkan transaksi pertama.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {group.transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{transaction.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {getPayerName(transaction.payerId)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transaction.items.length} item • {formatDate(transaction.date)}
                        </p>
                        {transaction.discounts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {transaction.discounts.map((d) => (
                              <Badge key={d.id} variant="outline" className="text-xs text-green-600">
                                {d.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(getTransactionTotal(transaction))}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setIsTransactionDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteTransactionId(transaction.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {group.members.length} member
            </p>
            <Button onClick={() => setIsMemberDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Member
            </Button>
          </div>

          {group.members.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center">
                  Belum ada member.<br />
                  Tambahkan member terlebih dahulu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {group.members.map((member) => {
                const balance = calculation.balances.find(b => b.memberId === member.id);
                return (
                  <Card key={member.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {balance && (
                              <p className={`text-xs ${
                                balance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {balance.netBalance >= 0 ? '+' : ''}{formatCurrency(balance.netBalance)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingMember(member)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteMemberId(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Settlement Tab */}
        <TabsContent value="settlement">
          <SettlementView calculation={calculation} />
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Nama Member
            </label>
            <Input
              placeholder="Contoh: Budi"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMember();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Nama Member
            </label>
            <Input
              value={editingMember?.name || ''}
              onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateMember();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdateMember} disabled={!editingMember?.name.trim()}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={!!deleteMemberId} onOpenChange={() => setDeleteMemberId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Member akan dihapus dari semua pembagian item.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMemberId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteMemberId) {
                  onDeleteMember(group.id, deleteMemberId);
                  setDeleteMemberId(null);
                }
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      <Dialog
        open={isTransactionDialogOpen}
        onOpenChange={(open) => {
          setIsTransactionDialogOpen(open);
          if (!open) setEditingTransaction(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            group={group}
            transaction={editingTransaction}
            onSave={(data) => {
              if (editingTransaction) {
                onUpdateTransaction(group.id, editingTransaction.id, data);
              } else {
                onAddTransaction(group.id, data);
              }
              setIsTransactionDialogOpen(false);
              setEditingTransaction(null);
            }}
            onCancel={() => {
              setIsTransactionDialogOpen(false);
              setEditingTransaction(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={!!deleteTransactionId} onOpenChange={() => setDeleteTransactionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Transaksi akan dihapus permanen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTransactionId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTransactionId) {
                  onDeleteTransaction(group.id, deleteTransactionId);
                  setDeleteTransactionId(null);
                }
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
