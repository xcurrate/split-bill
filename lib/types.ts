// ============================================
// TYPES - Split Bill App
// ============================================

export interface Member {
  id: string;
  name: string;
}

export interface ItemSplit {
  memberId: string;
  quantity: number; // Quantity of this item assigned to member (for shared items)
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  splits: ItemSplit[]; // Who pays for this item
}

export type DiscountType = 'percentage' | 'fixed';
export type DiscountAllocation = 'proportional' | 'equal' | 'custom';

export interface Discount {
  id: string;
  name: string;
  type: DiscountType;
  value: number; // percentage (0-100) or fixed amount
  allocation: DiscountAllocation;
  customAllocations?: Record<string, number>; // memberId -> amount (for custom allocation)
}

export interface Transaction {
  id: string;
  name: string;
  /** @deprecated Kept so transactions saved by older app versions still work. */
  payerId: string;
  /** Amount actually paid by each member. The sum must equal the transaction total. */
  payments?: Payment[];
  items: Item[];
  discounts: Discount[];
  tax: number; // Tax amount (fixed)
  serviceCharge: number; // Service charge (fixed)
  date: string;
}

export interface Payment {
  memberId: string;
  amount: number;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CALCULATION RESULT TYPES
// ============================================

export interface MemberSubtotal {
  memberId: string;
  memberName: string;
  itemsTotal: number; // Total before discount
  discountShare: number; // Discount allocated to this member
  taxShare: number; // Tax allocated to this member
  serviceChargeShare: number; // Service charge allocated to this member
  netTotal: number; // Final amount after all allocations
}

export interface TransactionCalculation {
  transactionId: string;
  transactionName: string;
  subtotal: number; // Sum of all items
  totalDiscount: number;
  totalTax: number;
  totalServiceCharge: number;
  grandTotal: number;
  memberSubtotals: MemberSubtotal[];
}

export interface Balance {
  memberId: string;
  memberName: string;
  paid: number; // Total amount this member paid as payer
  owes: number; // Total amount this member owes for items
  netBalance: number; // positive = should receive, negative = should pay
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface GroupCalculation {
  groupId: string;
  groupName: string;
  totalAmount: number;
  balances: Balance[];
  settlements: Settlement[];
  transactionCalculations: TransactionCalculation[];
}
