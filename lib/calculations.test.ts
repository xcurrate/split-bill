// ============================================
// UNIT TESTS - Calculations
// ============================================

import { describe, it, expect } from 'vitest';
import {
  getItemTotal,
  getMemberItemShare,
  calculateDiscountAmount,
  allocateDiscount,
  calculateTransaction,
  calculateSettlements,
  calculateGroup,
  getTransactionPayments,
} from './calculations';
import {
  Item,
  Discount,
  Transaction,
  Member,
  Group,
  Balance,
} from './types';

// ============================================
// TEST DATA HELPERS
// ============================================

const createItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'item-1',
  name: 'Test Item',
  price: 10000,
  quantity: 1,
  splits: [],
  ...overrides,
});

const createDiscount = (overrides: Partial<Discount> = {}): Discount => ({
  id: 'discount-1',
  name: 'Test Discount',
  type: 'percentage',
  value: 10,
  allocation: 'proportional',
  ...overrides,
});

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'trans-1',
  name: 'Test Transaction',
  payerId: 'member-1',
  items: [],
  discounts: [],
  tax: 0,
  serviceCharge: 0,
  date: new Date().toISOString(),
  ...overrides,
});

const createMember = (id: string, name: string): Member => ({ id, name });

// ============================================
// ITEM CALCULATIONS TESTS
// ============================================

describe('getItemTotal', () => {
  it('should calculate total for single quantity', () => {
    const item = createItem({ price: 10000, quantity: 1 });
    expect(getItemTotal(item)).toBe(10000);
  });

  it('should calculate total for multiple quantity', () => {
    const item = createItem({ price: 10000, quantity: 3 });
    expect(getItemTotal(item)).toBe(30000);
  });

  it('should handle zero quantity', () => {
    const item = createItem({ price: 10000, quantity: 0 });
    expect(getItemTotal(item)).toBe(0);
  });
});

describe('getMemberItemShare', () => {
  it('should return 0 if member not assigned', () => {
    const item = createItem({
      price: 10000,
      quantity: 1,
      splits: [{ memberId: 'member-1', quantity: 1 }],
    });
    expect(getMemberItemShare(item, 'member-2')).toBe(0);
  });

  it('should return full amount for single member', () => {
    const item = createItem({
      price: 10000,
      quantity: 1,
      splits: [{ memberId: 'member-1', quantity: 1 }],
    });
    expect(getMemberItemShare(item, 'member-1')).toBe(10000);
  });

  it('should split proportionally for multiple members', () => {
    const item = createItem({
      price: 30000,
      quantity: 1,
      splits: [
        { memberId: 'member-1', quantity: 1 },
        { memberId: 'member-2', quantity: 2 },
      ],
    });
    expect(getMemberItemShare(item, 'member-1')).toBe(10000);
    expect(getMemberItemShare(item, 'member-2')).toBe(20000);
  });

  it('should handle shared items with equal split', () => {
    const item = createItem({
      price: 20000,
      quantity: 1,
      splits: [
        { memberId: 'member-1', quantity: 1 },
        { memberId: 'member-2', quantity: 1 },
      ],
    });
    expect(getMemberItemShare(item, 'member-1')).toBe(10000);
    expect(getMemberItemShare(item, 'member-2')).toBe(10000);
  });
});

// ============================================
// DISCOUNT CALCULATIONS TESTS
// ============================================

describe('calculateDiscountAmount', () => {
  it('should calculate percentage discount', () => {
    const discount = createDiscount({ type: 'percentage', value: 10 });
    expect(calculateDiscountAmount(discount, 100000)).toBe(10000);
  });

  it('should calculate fixed discount', () => {
    const discount = createDiscount({ type: 'fixed', value: 5000 });
    expect(calculateDiscountAmount(discount, 100000)).toBe(5000);
  });

  it('should cap fixed discount at subtotal', () => {
    const discount = createDiscount({ type: 'fixed', value: 150000 });
    expect(calculateDiscountAmount(discount, 100000)).toBe(100000);
  });

  it('should handle zero discount', () => {
    const discount = createDiscount({ type: 'percentage', value: 0 });
    expect(calculateDiscountAmount(discount, 100000)).toBe(0);
  });
});

describe('allocateDiscount', () => {
  const members = new Map([
    ['member-1', 60000],
    ['member-2', 40000],
  ]);
  const totalSubtotal = 100000;

  it('should allocate proportionally by default', () => {
    const discount = createDiscount({
      type: 'percentage',
      value: 10,
      allocation: 'proportional',
    });
    const allocations = allocateDiscount(discount, members, totalSubtotal);
    expect(allocations.get('member-1')).toBe(6000); // 60% of 10k
    expect(allocations.get('member-2')).toBe(4000); // 40% of 10k
  });

  it('should allocate equally when specified', () => {
    const discount = createDiscount({
      type: 'fixed',
      value: 10000,
      allocation: 'equal',
    });
    const allocations = allocateDiscount(discount, members, totalSubtotal);
    expect(allocations.get('member-1')).toBe(5000);
    expect(allocations.get('member-2')).toBe(5000);
  });

  it('should use custom allocations when specified', () => {
    const discount = createDiscount({
      type: 'fixed',
      value: 10000,
      allocation: 'custom',
      customAllocations: {
        'member-1': 7000,
        'member-2': 3000,
      },
    });
    const allocations = allocateDiscount(discount, members, totalSubtotal);
    expect(allocations.get('member-1')).toBe(7000);
    expect(allocations.get('member-2')).toBe(3000);
  });
});

// ============================================
// TRANSACTION CALCULATIONS TESTS
// ============================================

describe('calculateTransaction', () => {
  const members = [
    createMember('member-1', 'Alice'),
    createMember('member-2', 'Bob'),
  ];

  it('should calculate simple transaction', () => {
    const transaction = createTransaction({
      items: [
        createItem({
          id: 'item-1',
          name: 'Nasi Goreng',
          price: 25000,
          quantity: 1,
          splits: [{ memberId: 'member-1', quantity: 1 }],
        }),
        createItem({
          id: 'item-2',
          name: 'Mie Goreng',
          price: 20000,
          quantity: 1,
          splits: [{ memberId: 'member-2', quantity: 1 }],
        }),
      ],
    });

    const result = calculateTransaction(transaction, members);

    expect(result.subtotal).toBe(45000);
    expect(result.grandTotal).toBe(45000);
    expect(result.memberSubtotals).toHaveLength(2);
    
    const alice = result.memberSubtotals.find(m => m.memberId === 'member-1');
    const bob = result.memberSubtotals.find(m => m.memberId === 'member-2');
    
    expect(alice?.netTotal).toBe(25000);
    expect(bob?.netTotal).toBe(20000);
  });

  it('should handle shared items', () => {
    const transaction = createTransaction({
      items: [
        createItem({
          id: 'item-1',
          name: 'Sharing Plate',
          price: 50000,
          quantity: 1,
          splits: [
            { memberId: 'member-1', quantity: 1 },
            { memberId: 'member-2', quantity: 1 },
          ],
        }),
      ],
    });

    const result = calculateTransaction(transaction, members);

    const alice = result.memberSubtotals.find(m => m.memberId === 'member-1');
    const bob = result.memberSubtotals.find(m => m.memberId === 'member-2');
    
    expect(alice?.netTotal).toBe(25000);
    expect(bob?.netTotal).toBe(25000);
  });

  it('should apply percentage discount proportionally', () => {
    const transaction = createTransaction({
      items: [
        createItem({
          id: 'item-1',
          name: 'Nasi Goreng',
          price: 60000,
          quantity: 1,
          splits: [{ memberId: 'member-1', quantity: 1 }],
        }),
        createItem({
          id: 'item-2',
          name: 'Mie Goreng',
          price: 40000,
          quantity: 1,
          splits: [{ memberId: 'member-2', quantity: 1 }],
        }),
      ],
      discounts: [
        createDiscount({ type: 'percentage', value: 10, allocation: 'proportional' }),
      ],
    });

    const result = calculateTransaction(transaction, members);

    expect(result.totalDiscount).toBe(10000);
    expect(result.grandTotal).toBe(90000);

    const alice = result.memberSubtotals.find(m => m.memberId === 'member-1');
    const bob = result.memberSubtotals.find(m => m.memberId === 'member-2');
    
    // Alice: 60k - 6k (10% of 60k) = 54k
    // Bob: 40k - 4k (10% of 40k) = 36k
    expect(alice?.discountShare).toBe(6000);
    expect(alice?.netTotal).toBe(54000);
    expect(bob?.discountShare).toBe(4000);
    expect(bob?.netTotal).toBe(36000);
  });

  it('should allocate tax and service charge proportionally', () => {
    const transaction = createTransaction({
      items: [
        createItem({
          id: 'item-1',
          name: 'Nasi Goreng',
          price: 60000,
          quantity: 1,
          splits: [{ memberId: 'member-1', quantity: 1 }],
        }),
        createItem({
          id: 'item-2',
          name: 'Mie Goreng',
          price: 40000,
          quantity: 1,
          splits: [{ memberId: 'member-2', quantity: 1 }],
        }),
      ],
      tax: 10000,
      serviceCharge: 5000,
    });

    const result = calculateTransaction(transaction, members);

    const alice = result.memberSubtotals.find(m => m.memberId === 'member-1');
    const bob = result.memberSubtotals.find(m => m.memberId === 'member-2');
    
    // Alice: 60% of tax (6k) + 60% of service (3k) = 9k
    // Bob: 40% of tax (4k) + 40% of service (2k) = 6k
    expect(alice?.taxShare).toBe(6000);
    expect(alice?.serviceChargeShare).toBe(3000);
    expect(bob?.taxShare).toBe(4000);
    expect(bob?.serviceChargeShare).toBe(2000);
  });
});

// ============================================
// SETTLEMENT CALCULATIONS TESTS
// ============================================

describe('calculateSettlements', () => {
  it('should return empty array when all settled', () => {
    const balances: Balance[] = [
      { memberId: '1', memberName: 'A', paid: 100, owes: 100, netBalance: 0 },
      { memberId: '2', memberName: 'B', paid: 100, owes: 100, netBalance: 0 },
    ];
    expect(calculateSettlements(balances)).toHaveLength(0);
  });

  it('should handle simple two-person settlement', () => {
    const balances: Balance[] = [
      { memberId: '1', memberName: 'Alice', paid: 100, owes: 50, netBalance: 50 },
      { memberId: '2', memberName: 'Bob', paid: 0, owes: 50, netBalance: -50 },
    ];
    const settlements = calculateSettlements(balances);
    
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toEqual({
      from: '2',
      fromName: 'Bob',
      to: '1',
      toName: 'Alice',
      amount: 50,
    });
  });

  it('should minimize transfers for multiple people', () => {
    const balances: Balance[] = [
      { memberId: '1', memberName: 'A', paid: 300, owes: 100, netBalance: 200 },
      { memberId: '2', memberName: 'B', paid: 0, owes: 100, netBalance: -100 },
      { memberId: '3', memberName: 'C', paid: 0, owes: 100, netBalance: -100 },
    ];
    const settlements = calculateSettlements(balances);
    
    // Should have 2 settlements (not 3)
    expect(settlements).toHaveLength(2);
    
    // Total settled should equal total debt
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(totalSettled).toBe(200);
  });

  it('should handle complex settlement scenario', () => {
    const balances: Balance[] = [
      { memberId: '1', memberName: 'Alice', paid: 500, owes: 200, netBalance: 300 },
      { memberId: '2', memberName: 'Bob', paid: 100, owes: 300, netBalance: -200 },
      { memberId: '3', memberName: 'Charlie', paid: 100, owes: 300, netBalance: -200 },
      { memberId: '4', memberName: 'David', paid: 300, owes: 200, netBalance: 100 },
    ];
    const settlements = calculateSettlements(balances);
    
    // Verify all debts are settled
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalDebt = balances.filter(b => b.netBalance < 0).reduce((sum, b) => sum + Math.abs(b.netBalance), 0);
    expect(totalSettled).toBe(totalDebt);
    
    // Should have 3 settlements (not more)
    expect(settlements.length).toBeLessThanOrEqual(3);
  });
});

// ============================================
// GROUP CALCULATIONS TESTS
// ============================================

describe('calculateGroup', () => {
  it('credits each payer when two members pay one transaction together', () => {
    const group: Group = {
      id: 'group-multi-payer',
      name: 'Shared payment',
      members: [createMember('member-1', 'Alice'), createMember('member-2', 'Bob'), createMember('member-3', 'Charlie')],
      transactions: [createTransaction({
        payerId: 'member-1',
        payments: [
          { memberId: 'member-1', amount: 60000 },
          { memberId: 'member-2', amount: 40000 },
        ],
        items: [createItem({ price: 100000, splits: [
          { memberId: 'member-1', quantity: 2 },
          { memberId: 'member-2', quantity: 1 },
          { memberId: 'member-3', quantity: 1 },
        ] })],
      })],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = calculateGroup(group);

    expect(result.balances.find(balance => balance.memberId === 'member-1')?.netBalance).toBe(10000);
    expect(result.balances.find(balance => balance.memberId === 'member-2')?.netBalance).toBe(15000);
    expect(result.balances.find(balance => balance.memberId === 'member-3')?.netBalance).toBe(-25000);
    expect(result.settlements.reduce((sum, settlement) => sum + settlement.amount, 0)).toBe(25000);
  });

  it('uses the legacy single payer when split payments are absent', () => {
    const transaction = createTransaction({ payerId: 'member-2' });
    expect(getTransactionPayments(transaction, 75000)).toEqual([{ memberId: 'member-2', amount: 75000 }]);
  });

  it('should calculate complete group with multiple transactions', () => {
    const group: Group = {
      id: 'group-1',
      name: 'Dinner Group',
      members: [
        createMember('member-1', 'Alice'),
        createMember('member-2', 'Bob'),
      ],
      transactions: [
        createTransaction({
          id: 'trans-1',
          payerId: 'member-1',
          items: [
            createItem({
              id: 'item-1',
              name: 'Food',
              price: 100000,
              quantity: 1,
              splits: [
                { memberId: 'member-1', quantity: 1 },
                { memberId: 'member-2', quantity: 1 },
              ],
            }),
          ],
        }),
        createTransaction({
          id: 'trans-2',
          payerId: 'member-2',
          items: [
            createItem({
              id: 'item-2',
              name: 'Drinks',
              price: 60000,
              quantity: 1,
              splits: [
                { memberId: 'member-1', quantity: 1 },
                { memberId: 'member-2', quantity: 1 },
              ],
            }),
          ],
        }),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = calculateGroup(group);

    // Total: 100k + 60k = 160k
    expect(result.totalAmount).toBe(160000);
    
    // Each member's share: 50k (food) + 30k (drinks) = 80k
    const alice = result.balances.find(b => b.memberId === 'member-1');
    const bob = result.balances.find(b => b.memberId === 'member-2');
    
    expect(alice?.owes).toBe(80000);
    expect(alice?.paid).toBe(100000);
    expect(alice?.netBalance).toBe(20000); // Should receive 20k
    
    expect(bob?.owes).toBe(80000);
    expect(bob?.paid).toBe(60000);
    expect(bob?.netBalance).toBe(-20000); // Should pay 20k
    
    // Settlement: Bob pays Alice 20k
    expect(result.settlements).toHaveLength(1);
    expect(result.settlements[0]).toEqual({
      from: 'member-2',
      fromName: 'Bob',
      to: 'member-1',
      toName: 'Alice',
      amount: 20000,
    });
  });
});
