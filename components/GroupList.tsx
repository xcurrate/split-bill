'use client';

import { useState } from 'react';
import { Plus, Users, Trash2, ChevronRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Group } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface GroupListProps {
  groups: Group[];
  onAddGroup: (name: string) => void;
  onDeleteGroup: (id: string) => void;
  onSelectGroup: (group: Group) => void;
}

export function GroupList({ groups, onAddGroup, onDeleteGroup, onSelectGroup }: GroupListProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setIsDialogOpen(false);
    }
  };

  const getGroupTotal = (group: Group) => {
    return group.transactions.reduce((total, t) => {
      const itemsTotal = t.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountsTotal = t.discounts.reduce((sum, d) => {
        if (d.type === 'percentage') {
          return sum + (itemsTotal * d.value / 100);
        }
        return sum + d.value;
      }, 0);
      return total + itemsTotal - discountsTotal + t.tax + t.serviceCharge;
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Split Bill</h1>
          <p className="text-sm text-muted-foreground">
            {groups.length} grup aktif
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Grup Baru
        </Button>
      </div>

      {/* Group List */}
      {groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              Belum ada grup.<br />
              Buat grup baru untuk mulai membagi tagihan.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Buat Grup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelectGroup(group)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{group.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {group.members.length} member
                      </span>
                      <span className="flex items-center gap-1">
                        <Receipt className="h-3.5 w-3.5" />
                        {group.transactions.length} transaksi
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(group.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(getGroupTotal(group))}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(group.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Group Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Grup Baru</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Nama Grup
            </label>
            <Input
              placeholder="Contoh: Makan Malam Bersama"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddGroup();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim()}>
              Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Grup?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Tindakan ini tidak dapat dibatalkan. Semua data grup akan dihapus permanen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteGroup(deleteConfirmId);
                  setDeleteConfirmId(null);
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
