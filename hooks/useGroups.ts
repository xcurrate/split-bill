'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Group, Member, Transaction, Item, Discount } from '@/lib/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'split-bill-groups';

// Sample/Seed data
const seedGroups: Group[] = [
  {
    id: 'seed-group-1',
    name: '🍜 Makan Malam Bersama',
    members: [
      { id: 'm1', name: 'Budi' },
      { id: 'm2', name: 'Ani' },
      { id: 'm3', name: 'Charlie' },
    ],
    transactions: [
      {
        id: 't1',
        name: 'Restoran Padang',
        payerId: 'm1',
        date: new Date().toISOString(),
        items: [
          {
            id: 'i1',
            name: 'Rendang',
            price: 35000,
            quantity: 2,
            splits: [
              { memberId: 'm1', quantity: 1 },
              { memberId: 'm2', quantity: 1 },
            ],
          },
          {
            id: 'i2',
            name: 'Ayam Pop',
            price: 28000,
            quantity: 1,
            splits: [{ memberId: 'm3', quantity: 1 }],
          },
          {
            id: 'i3',
            name: 'Es Teh Manis',
            price: 8000,
            quantity: 3,
            splits: [
              { memberId: 'm1', quantity: 1 },
              { memberId: 'm2', quantity: 1 },
              { memberId: 'm3', quantity: 1 },
            ],
          },
          {
            id: 'i4',
            name: 'Nasi Putih',
            price: 10000,
            quantity: 3,
            splits: [
              { memberId: 'm1', quantity: 1 },
              { memberId: 'm2', quantity: 1 },
              { memberId: 'm3', quantity: 1 },
            ],
          },
        ],
        discounts: [
          {
            id: 'd1',
            name: 'Diskon 10%',
            type: 'percentage',
            value: 10,
            allocation: 'proportional',
          },
        ],
        tax: 5000,
        serviceCharge: 10000,
      },
      {
        id: 't2',
        name: 'Kopi Kenangan',
        payerId: 'm2',
        date: new Date().toISOString(),
        items: [
          {
            id: 'i5',
            name: 'Kopi Susu',
            price: 22000,
            quantity: 2,
            splits: [
              { memberId: 'm1', quantity: 1 },
              { memberId: 'm2', quantity: 1 },
            ],
          },
          {
            id: 'i6',
            name: 'Matcha Latte',
            price: 28000,
            quantity: 1,
            splits: [{ memberId: 'm3', quantity: 1 }],
          },
        ],
        discounts: [],
        tax: 0,
        serviceCharge: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useGroups() {
  const [groups, setGroups] = useLocalStorage<Group[]>(STORAGE_KEY, seedGroups);

  // Group CRUD
  const addGroup = useCallback((name: string) => {
    const newGroup: Group = {
      id: generateId(),
      name,
      members: [],
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGroups(prev => [newGroup, ...prev]);
    return newGroup.id;
  }, [setGroups]);

  const updateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, ...updates, updatedAt: new Date().toISOString() }
          : group
      )
    );
  }, [setGroups]);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  }, [setGroups]);

  const getGroup = useCallback((groupId: string) => {
    return groups.find(group => group.id === groupId);
  }, [groups]);

  // Member CRUD
  const addMember = useCallback((groupId: string, name: string) => {
    const newMember: Member = {
      id: generateId(),
      name,
    };
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              members: [...group.members, newMember],
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
    return newMember.id;
  }, [setGroups]);

  const updateMember = useCallback((groupId: string, memberId: string, name: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              members: group.members.map(member =>
                member.id === memberId ? { ...member, name } : member
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  const deleteMember = useCallback((groupId: string, memberId: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              members: group.members.filter(member => member.id !== memberId),
              // Also remove member from all item splits
              transactions: group.transactions.map(transaction => ({
                ...transaction,
                payments: transaction.payments?.filter(payment => payment.memberId !== memberId),
                items: transaction.items.map(item => ({
                  ...item,
                  splits: item.splits.filter(split => split.memberId !== memberId),
                })),
              })),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  // Transaction CRUD
  const addTransaction = useCallback((groupId: string, transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      date: new Date().toISOString(),
    };
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: [...group.transactions, newTransaction],
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
    return newTransaction.id;
  }, [setGroups]);

  const updateTransaction = useCallback((groupId: string, transactionId: string, updates: Partial<Transaction>) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? { ...transaction, ...updates }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  const deleteTransaction = useCallback((groupId: string, transactionId: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.filter(t => t.id !== transactionId),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  // Item CRUD
  const addItem = useCallback((groupId: string, transactionId: string, item: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...item,
      id: generateId(),
    };
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? { ...transaction, items: [...transaction.items, newItem] }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
    return newItem.id;
  }, [setGroups]);

  const updateItem = useCallback((groupId: string, transactionId: string, itemId: string, updates: Partial<Item>) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? {
                      ...transaction,
                      items: transaction.items.map(item =>
                        item.id === itemId ? { ...item, ...updates } : item
                      ),
                    }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  const deleteItem = useCallback((groupId: string, transactionId: string, itemId: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? {
                      ...transaction,
                      items: transaction.items.filter(item => item.id !== itemId),
                    }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  // Discount CRUD
  const addDiscount = useCallback((groupId: string, transactionId: string, discount: Omit<Discount, 'id'>) => {
    const newDiscount: Discount = {
      ...discount,
      id: generateId(),
    };
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? { ...transaction, discounts: [...transaction.discounts, newDiscount] }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
    return newDiscount.id;
  }, [setGroups]);

  const updateDiscount = useCallback((groupId: string, transactionId: string, discountId: string, updates: Partial<Discount>) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? {
                      ...transaction,
                      discounts: transaction.discounts.map(discount =>
                        discount.id === discountId ? { ...discount, ...updates } : discount
                      ),
                    }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  const deleteDiscount = useCallback((groupId: string, transactionId: string, discountId: string) => {
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              transactions: group.transactions.map(transaction =>
                transaction.id === transactionId
                  ? {
                      ...transaction,
                      discounts: transaction.discounts.filter(d => d.id !== discountId),
                    }
                  : transaction
              ),
              updatedAt: new Date().toISOString(),
            }
          : group
      )
    );
  }, [setGroups]);

  // Reset to seed data
  const resetToSeed = useCallback(() => {
    setGroups(seedGroups);
  }, [setGroups]);

  // Clear all data
  const clearAll = useCallback(() => {
    setGroups([]);
  }, [setGroups]);

  return useMemo(() => ({
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    addMember,
    updateMember,
    deleteMember,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addItem,
    updateItem,
    deleteItem,
    addDiscount,
    updateDiscount,
    deleteDiscount,
    resetToSeed,
    clearAll,
  }), [
    groups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    addMember,
    updateMember,
    deleteMember,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addItem,
    updateItem,
    deleteItem,
    addDiscount,
    updateDiscount,
    deleteDiscount,
    resetToSeed,
    clearAll,
  ]);
}
