// ============================================
// CALCULATIONS - Split Bill App
// ============================================

import {
  Group,
  Transaction,
  Item,
  Discount,
  MemberSubtotal,
  TransactionCalculation,
  Balance,
  Settlement,
  GroupCalculation,
  DiscountAllocation,
  Payment,
} from './types';

// ============================================
// ITEM CALCULATIONS
// ============================================

/**
 * Calculate total price for an item (price * quantity)
 */
export function getItemTotal(item: Item): number {
  return item.price * item.quantity;
}

/**
 * Calculate how much a specific member owes for an item
 * Returns 0 if member is not assigned to this item
 */
export function getMemberItemShare(item: Item, memberId: string): number {
  const itemTotal = getItemTotal(item);
  const totalSplitQuantity = item.splits.reduce((sum, s) => sum + s.quantity, 0);
  
  if (totalSplitQuantity === 0) return 0;
  
  const memberSplit = item.splits.find(s => s.memberId === memberId);
  if (!memberSplit) return 0;
  
  return (itemTotal * memberSplit.quantity) / totalSplitQuantity;
}

// ============================================
// DISCOUNT ALLOCATION
// ============================================

/**
 * Calculate discount amount based on discount type and value
 */
export function calculateDiscountAmount(discount: Discount, subtotal: number): number {
  if (discount.type === 'percentage') {
    return (subtotal * discount.value) / 100;
  }
  return Math.min(discount.value, subtotal); // Fixed discount cannot exceed subtotal
}

/**
 * Allocate discount to members based on allocation method
 */
export function allocateDiscount(
  discount: Discount,
  memberSubtotals: Map<string, number>, // memberId -> items total
  totalSubtotal: number
): Map<string, number> {
  const allocations = new Map<string, number>();
  const discountAmount = calculateDiscountAmount(discount, totalSubtotal);
  
  if (discountAmount <= 0) {
    memberSubtotals.forEach((_, memberId) => allocations.set(memberId, 0));
    return allocations;
  }

  switch (discount.allocation) {
    case 'equal': {
      // Split discount equally among all members
      const memberCount = memberSubtotals.size;
      const equalShare = discountAmount / memberCount;
      memberSubtotals.forEach((_, memberId) => allocations.set(memberId, equalShare));
      break;
    }
    
    case 'custom': {
      // Use custom allocations, fallback to 0 if not specified
      memberSubtotals.forEach((_, memberId) => {
        const customAmount = discount.customAllocations?.[memberId] || 0;
        allocations.set(memberId, customAmount);
      });
      break;
    }
    
    case 'proportional':
    default: {
      // Split discount proportionally based on member's subtotal
      memberSubtotals.forEach((subtotal, memberId) => {
        if (totalSubtotal > 0) {
          const proportion = subtotal / totalSubtotal;
          allocations.set(memberId, discountAmount * proportion);
        } else {
          allocations.set(memberId, 0);
        }
      });
      break;
    }
  }
  
  return allocations;
}

// ============================================
// TRANSACTION CALCULATIONS
// ============================================

/**
 * Calculate all details for a single transaction
 */
export function calculateTransaction(
  transaction: Transaction,
  members: { id: string; name: string }[]
): TransactionCalculation {
  // Calculate subtotal (sum of all items)
  const subtotal = transaction.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  
  // Calculate each member's share of items
  const memberItemsTotal = new Map<string, number>();
  members.forEach(member => {
    const memberTotal = transaction.items.reduce(
      (sum, item) => sum + getMemberItemShare(item, member.id),
      0
    );
    memberItemsTotal.set(member.id, memberTotal);
  });
  
  // Calculate total discount
  let totalDiscount = 0;
  transaction.discounts.forEach(discount => {
    totalDiscount += calculateDiscountAmount(discount, subtotal);
  });
  
  // Allocate each discount and sum up per member
  const memberDiscountShares = new Map<string, number>();
  members.forEach(m => memberDiscountShares.set(m.id, 0));
  
  transaction.discounts.forEach(discount => {
    const allocations = allocateDiscount(discount, memberItemsTotal, subtotal);
    allocations.forEach((amount, memberId) => {
      memberDiscountShares.set(memberId, (memberDiscountShares.get(memberId) || 0) + amount);
    });
  });
  
  // Allocate tax and service charge proportionally
  const memberTaxShares = new Map<string, number>();
  const memberServiceChargeShares = new Map<string, number>();
  
  members.forEach(member => {
    const memberSubtotal = memberItemsTotal.get(member.id) || 0;
    const proportion = subtotal > 0 ? memberSubtotal / subtotal : 0;
    
    memberTaxShares.set(member.id, transaction.tax * proportion);
    memberServiceChargeShares.set(member.id, transaction.serviceCharge * proportion);
  });
  
  // Calculate net total for each member
  const memberSubtotals: MemberSubtotal[] = members.map(member => {
    const itemsTotal = memberItemsTotal.get(member.id) || 0;
    const discountShare = memberDiscountShares.get(member.id) || 0;
    const taxShare = memberTaxShares.get(member.id) || 0;
    const serviceChargeShare = memberServiceChargeShares.get(member.id) || 0;
    
    const netTotal = itemsTotal - discountShare + taxShare + serviceChargeShare;
    
    return {
      memberId: member.id,
      memberName: member.name,
      itemsTotal,
      discountShare,
      taxShare,
      serviceChargeShare,
      netTotal: Math.max(0, netTotal), // Ensure non-negative
    };
  });
  
  // Calculate grand total
  const grandTotal = subtotal - totalDiscount + transaction.tax + transaction.serviceCharge;
  
  return {
    transactionId: transaction.id,
    transactionName: transaction.name,
    subtotal,
    totalDiscount,
    totalTax: transaction.tax,
    totalServiceCharge: transaction.serviceCharge,
    grandTotal: Math.max(0, grandTotal),
    memberSubtotals,
  };
}

/**
 * Return the recorded payments for a transaction. `payerId` is retained as a
 * backwards-compatible fallback for transactions created before split payments
 * were supported.
 */
export function getTransactionPayments(
  transaction: Transaction,
  grandTotal: number
): Payment[] {
  const payments = transaction.payments
    ?.filter(payment => Number.isFinite(payment.amount) && payment.amount > 0)
    .filter(payment => payment.memberId);

  if (payments && payments.length > 0) return payments;

  return transaction.payerId ? [{ memberId: transaction.payerId, amount: grandTotal }] : [];
}

// ============================================
// GROUP CALCULATIONS & SETTLEMENT
// ============================================

/**
 * Calculate balances for all members in a group
 */
export function calculateBalances(
  group: Group,
  transactionCalculations: TransactionCalculation[]
): Balance[] {
  const balanceMap = new Map<string, Balance>();
  
  // Initialize balances
  group.members.forEach(member => {
    balanceMap.set(member.id, {
      memberId: member.id,
      memberName: member.name,
      paid: 0,
      owes: 0,
      netBalance: 0,
    });
  });
  
  // Calculate what each member paid and owes
  group.transactions.forEach((transaction, idx) => {
    const calc = transactionCalculations[idx];
    
    // Credit every recorded payer. Older transactions use payerId as a fallback.
    getTransactionPayments(transaction, calc.grandTotal).forEach(payment => {
      const payerBalance = balanceMap.get(payment.memberId);
      if (payerBalance) payerBalance.paid += payment.amount;
    });
    
    // Add to each member's owes amount
    calc.memberSubtotals.forEach(memberSubtotal => {
      const memberBalance = balanceMap.get(memberSubtotal.memberId);
      if (memberBalance) {
        memberBalance.owes += memberSubtotal.netTotal;
      }
    });
  });
  
  // Calculate net balance (positive = should receive, negative = should pay)
  balanceMap.forEach(balance => {
    balance.netBalance = balance.paid - balance.owes;
  });
  
  return Array.from(balanceMap.values());
}

/**
 * Calculate optimal settlement to minimize number of transfers
 * Uses a greedy algorithm to settle debts
 */
export function calculateSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate creditors (positive balance = should receive) and debtors (negative balance = should pay)
  const creditors = balances
    .filter(b => b.netBalance > 0.01) // Small threshold to handle floating point
    .map(b => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);
  
  const debtors = balances
    .filter(b => b.netBalance < -0.01)
    .map(b => ({ ...b, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);
  
  let creditorIdx = 0;
  let debtorIdx = 0;
  
  // Match debtors with creditors
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];
    
    const settleAmount = Math.min(creditor.remaining, debtor.remaining);
    
    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.memberId,
        fromName: debtor.memberName,
        to: creditor.memberId,
        toName: creditor.memberName,
        amount: Math.round(settleAmount), // Round to nearest integer
      });
    }
    
    creditor.remaining -= settleAmount;
    debtor.remaining -= settleAmount;
    
    if (creditor.remaining < 0.01) creditorIdx++;
    if (debtor.remaining < 0.01) debtorIdx++;
  }
  
  return settlements;
}

/**
 * Calculate everything for a group
 */
export function calculateGroup(group: Group): GroupCalculation {
  // Calculate all transactions
  const transactionCalculations = group.transactions.map(transaction =>
    calculateTransaction(transaction, group.members)
  );
  
  // Calculate balances
  const balances = calculateBalances(group, transactionCalculations);
  
  // Calculate settlements
  const settlements = calculateSettlements(balances);
  
  // Calculate total amount
  const totalAmount = transactionCalculations.reduce((sum, tc) => sum + tc.grandTotal, 0);
  
  return {
    groupId: group.id,
    groupName: group.name,
    totalAmount,
    balances,
    settlements,
    transactionCalculations,
  };
}

// ============================================
// SHARE TEXT GENERATION
// ============================================

/**
 * Generate shareable text summary
 */
export function generateShareText(group: Group, calculation: GroupCalculation): string {
  const lines: string[] = [];
  
  lines.push(`💰 ${group.name}`);
  lines.push(`Total: Rp${calculation.totalAmount.toLocaleString('id-ID')}`);
  lines.push('');
  
  // Member breakdown
  lines.push('📊 Per Member:');
  calculation.balances.forEach(balance => {
    const status = balance.netBalance >= 0 
      ? `+Rp${balance.netBalance.toLocaleString('id-ID')} (receive)`
      : `-Rp${Math.abs(balance.netBalance).toLocaleString('id-ID')} (pay)`;
    lines.push(`• ${balance.memberName}: ${status}`);
  });
  
  lines.push('');
  
  // Settlements
  if (calculation.settlements.length > 0) {
    lines.push('💸 Settlements:');
    calculation.settlements.forEach(s => {
      lines.push(`• ${s.fromName} → ${s.toName}: Rp${s.amount.toLocaleString('id-ID')}`);
    });
  } else {
    lines.push('✅ All settled!');
  }
  
  return lines.join('\n');
}
