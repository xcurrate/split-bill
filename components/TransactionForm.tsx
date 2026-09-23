'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Group, Transaction, Item, Discount, ItemSplit, Payment } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface TransactionFormProps {
  group: Group;
  transaction: Transaction | null;
  onSave: (data: Omit<Transaction, 'id' | 'date'>) => void;
  onCancel: () => void;
}

export function TransactionForm({ group, transaction, onSave, onCancel }: TransactionFormProps) {
  const [name, setName] = useState(transaction?.name || '');
  const [payerId, setPayerId] = useState(transaction?.payerId || group.members[0]?.id || '');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>(() => {
    if (transaction?.payments?.length) {
      return Object.fromEntries(transaction.payments.map(payment => [payment.memberId, payment.amount]));
    }
    return payerId ? { [payerId]: 0 } : {};
  });
  const [isAutoSinglePayment, setIsAutoSinglePayment] = useState(!transaction?.payments?.length);
  const [items, setItems] = useState<Item[]>(transaction?.items || []);
  const [discounts, setDiscounts] = useState<Discount[]>(transaction?.discounts || []);
  const [tax, setTax] = useState(transaction?.tax?.toString() || '0');
  const [serviceCharge, setServiceCharge] = useState(transaction?.serviceCharge?.toString() || '0');

  // Item form state
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemSplits, setItemSplits] = useState<ItemSplit[]>([]);

  // Discount form state
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountAllocation, setDiscountAllocation] = useState<'proportional' | 'equal' | 'custom'>('proportional');

  const addItem = () => {
    if (!itemName.trim() || !itemPrice || itemSplits.length === 0) return;

    const newItem: Item = {
      id: generateId(),
      name: itemName.trim(),
      price: parseFloat(itemPrice),
      quantity: parseInt(itemQuantity) || 1,
      splits: [...itemSplits],
    };

    setItems([...items, newItem]);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
    setItemSplits([]);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const addDiscount = () => {
    if (!discountName.trim() || !discountValue) return;

    const newDiscount: Discount = {
      id: generateId(),
      name: discountName.trim(),
      type: discountType,
      value: parseFloat(discountValue),
      allocation: discountAllocation,
    };

    setDiscounts([...discounts, newDiscount]);
    setDiscountName('');
    setDiscountValue('');
    setDiscountType('percentage');
    setDiscountAllocation('proportional');
  };

  const removeDiscount = (discountId: string) => {
    setDiscounts(discounts.filter(d => d.id !== discountId));
  };

  const toggleItemSplit = (memberId: string) => {
    const exists = itemSplits.find(s => s.memberId === memberId);
    if (exists) {
      setItemSplits(itemSplits.filter(s => s.memberId !== memberId));
    } else {
      setItemSplits([...itemSplits, { memberId, quantity: 1 }]);
    }
  };

  const updateSplitQuantity = (memberId: string, quantity: number) => {
    if (quantity <= 0) {
      setItemSplits(itemSplits.filter(s => s.memberId !== memberId));
      return;
    }
    setItemSplits(itemSplits.map(s => 
      s.memberId === memberId ? { ...s, quantity } : s
    ));
  };

  const togglePaymentMember = (memberId: string) => {
    setIsAutoSinglePayment(false);
    setPaymentAmounts(current => {
      if (memberId in current) {
        const { [memberId]: _, ...remaining } = current;
        return remaining;
      }
      return { ...current, [memberId]: 0 };
    });
  };

  const updatePaymentAmount = (memberId: string, amount: number) => {
    setIsAutoSinglePayment(false);
    setPaymentAmounts(current => ({ ...current, [memberId]: amount }));
  };

  const handleSave = () => {
    if (!name.trim() || !payerId || !paymentsMatchTotal) return;

    onSave({
      name: name.trim(),
      // Keep payerId for users opening this data in an older app version.
      payerId: payments[0].memberId,
      payments,
      items,
      discounts,
      tax: parseFloat(tax) || 0,
      serviceCharge: parseFloat(serviceCharge) || 0,
    });
  };

  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountsTotal = discounts.reduce((sum, d) => {
    if (d.type === 'percentage') {
      return sum + (itemsSubtotal * d.value / 100);
    }
    return sum + d.value;
  }, 0);
  const grandTotal = itemsSubtotal - discountsTotal + (parseFloat(tax) || 0) + (parseFloat(serviceCharge) || 0);
  const payments: Payment[] = Object.entries(paymentAmounts)
    .filter(([, amount]) => Number.isFinite(amount) && amount > 0)
    .map(([memberId, amount]) => ({ memberId, amount }));
  const paymentTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paymentsMatchTotal = payments.length > 0 && Math.abs(paymentTotal - grandTotal) < 0.01;

  useEffect(() => {
    if (isAutoSinglePayment && payerId) {
      setPaymentAmounts({ [payerId]: Math.max(0, grandTotal) });
    }
  }, [grandTotal, isAutoSinglePayment, payerId]);

  return (
    <div className="space-y-6 py-4">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label>Nama Transaksi</Label>
          <Input
            placeholder="Contoh: Restoran Padang"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Yang Membayar</Label>
          <p className="text-xs text-muted-foreground">Pilih satu atau beberapa member, lalu isi nominal yang benar-benar dibayar. Total pembayaran harus sama dengan total transaksi.</p>
          <div className="space-y-2 rounded-lg border p-3">
            {group.members.map(member => {
              const isPayer = member.id in paymentAmounts;
              return (
                <div key={member.id} className="flex items-center gap-2">
                  <Checkbox checked={isPayer} onCheckedChange={() => togglePaymentMember(member.id)} />
                  <span className="flex-1 text-sm">{member.name}</span>
                  {isPayer && (
                    <Input
                      aria-label={`Pembayaran ${member.name}`}
                      className="h-8 w-32"
                      min="0"
                      placeholder="Nominal"
                      type="number"
                      value={paymentAmounts[member.id] || ''}
                      onChange={(event) => updatePaymentAmount(member.id, parseFloat(event.target.value) || 0)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Separator />

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Item ({items.length})</Label>
        </div>

        {/* Item List */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Rp{item.price.toLocaleString('id-ID')} x {item.quantity}
                    {' = '}Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.splits.map((split) => {
                      const member = group.members.find(m => m.id === split.memberId);
                      return (
                        <Badge key={split.memberId} variant="secondary" className="text-xs">
                          {member?.name}{split.quantity > 1 && ` (${split.quantity})`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Form */}
        <div className="space-y-3 p-4 border rounded-lg">
          <p className="font-medium text-sm">Tambah Item</p>
          <Input
            placeholder="Nama item"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Harga"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Qty"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
            />
          </div>
          
          {/* Member Split Selection */}
          <div>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Dibagi ke:
            </p>
            <div className="space-y-2">
              {group.members.map(member => {
                const split = itemSplits.find(s => s.memberId === member.id);
                const isSelected = !!split;
                return (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSplit(member.id)}
                      />
                      <span className="text-sm">{member.name}</span>
                    </div>
                    {isSelected && (
                      <Input
                        type="number"
                        className="w-20 h-7 text-sm"
                        value={split.quantity}
                        onChange={(e) => updateSplitQuantity(member.id, parseInt(e.target.value) || 0)}
                        min={1}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Button 
            onClick={addItem} 
            disabled={!itemName.trim() || !itemPrice || itemSplits.length === 0}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </div>
      </div>

      <Separator />

      {/* Discounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Diskon ({discounts.length})</Label>
        </div>

        {/* Discount List */}
        {discounts.length > 0 && (
          <div className="space-y-2">
            {discounts.map((discount) => (
              <div key={discount.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">{discount.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {discount.type === 'percentage' ? `${discount.value}%` : `Rp${discount.value.toLocaleString('id-ID')}`}
                    {' • '}{discount.allocation === 'proportional' ? 'Proporsional' : discount.allocation === 'equal' ? 'Rata' : 'Custom'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeDiscount(discount.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Discount Form */}
        <div className="space-y-3 p-4 border rounded-lg">
          <p className="font-medium text-sm">Tambah Diskon</p>
          <Input
            placeholder="Nama diskon"
            value={discountName}
            onChange={(e) => setDiscountName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Persen (%)</SelectItem>
                <SelectItem value="fixed">Nominal (Rp)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={discountType === 'percentage' ? '10' : '5000'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>
          <Select value={discountAllocation} onValueChange={(v) => setDiscountAllocation(v as 'proportional' | 'equal' | 'custom')}>
            <SelectTrigger>
              <SelectValue placeholder="Alokasi diskon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proportional">Proporsional (default)</SelectItem>
              <SelectItem value="equal">Rata-rata</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={addDiscount} 
            disabled={!discountName.trim() || !discountValue}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Diskon
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tax & Service Charge */}
      <div className="space-y-4">
        <Label>Pajak & Service Charge</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Pajak (Rp)</p>
            <Input
              type="number"
              placeholder="0"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Service Charge (Rp)</p>
            <Input
              type="number"
              placeholder="0"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-2 p-4 bg-muted rounded-lg">
        <div className="flex justify-between text-sm">
          <span>Subtotal Item</span>
          <span>Rp{itemsSubtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Total Diskon</span>
          <span>-Rp{discountsTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Pajak</span>
          <span>Rp{(parseFloat(tax) || 0).toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Service Charge</span>
          <span>Rp{(parseFloat(serviceCharge) || 0).toLocaleString('id-ID')}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>Rp{grandTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className={`flex justify-between text-sm ${paymentsMatchTotal ? 'text-green-600' : 'text-destructive'}`}>
          <span>Total dibayar</span>
          <span>Rp{paymentTotal.toLocaleString('id-ID')} {!paymentsMatchTotal && `(selisih Rp${Math.abs(grandTotal - paymentTotal).toLocaleString('id-ID')})`}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Batal
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!name.trim() || !payerId || !paymentsMatchTotal}
          className="flex-1"
        >
          Simpan
        </Button>
      </div>
    </div>
  );
}
