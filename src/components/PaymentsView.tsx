import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  X,
  Check,
} from 'lucide-react';
import { usePG } from '../context/PGContext';
import { PaymentRecord, PaymentMethod, PaymentType } from '../types';
import { formatCurrency, formatDate, exportToCsv } from '../utils/helpers';

interface PaymentsViewProps {
  initialResidentIdForPayment?: string | null;
  onClearInitialResidentId?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  initialResidentIdForPayment,
  onClearInitialResidentId,
}) => {
  const { residents, payments, recordPayment } = usePG();

  const [activeTab, setActiveTab] = useState<'DUES' | 'HISTORY'>('DUES');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(Boolean(initialResidentIdForPayment));
  const [selectedResidentId, setSelectedResidentId] = useState<string>(
    initialResidentIdForPayment || residents[0]?.id || ''
  );
  const [billingMonth, setBillingMonth] = useState<string>('August 2026');
  const [paymentType, setPaymentType] = useState<PaymentType>('Rent');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [txnRef, setTxnRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const currentMonth = 'August 2026';
  const activeResidents = residents.filter((r) => r.status === 'ACTIVE');

  // Compute stats
  const expectedCollection = activeResidents.reduce((sum, r) => sum + r.monthlyRent, 0);
  const monthlyRentPayments = payments.filter(
    (p) => p.billingMonth === currentMonth && p.paymentType === 'Rent'
  );
  const collectedAmount = monthlyRentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalDue = Math.max(0, expectedCollection - collectedAmount);

  // Build dues roster
  const duesRoster = activeResidents.map((res) => {
    const resPayments = monthlyRentPayments.filter((p) => p.residentId === res.id);
    const paid = resPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const due = Math.max(0, res.monthlyRent - paid);
    let status: 'PAID' | 'PARTIAL' | 'DUE' = 'DUE';
    if (due === 0) status = 'PAID';
    else if (paid > 0) status = 'PARTIAL';

    return {
      resident: res,
      monthlyRent: res.monthlyRent,
      amountPaid: paid,
      remainingDue: due,
      status,
      paymentsCount: resPayments.length,
    };
  });

  // Selected resident for modal
  const targetResident = residents.find((r) => r.id === selectedResidentId) || residents[0];
  const targetMonthlyRent = targetResident?.monthlyRent || 8500;

  // Initialize custom amount when opening modal
  const handleOpenPaymentFor = (resId: string) => {
    const res = residents.find((r) => r.id === resId);
    if (res) {
      setSelectedResidentId(resId);
      const paidAlready = monthlyRentPayments
        .filter((p) => p.residentId === res.id)
        .reduce((sum, p) => sum + p.amountPaid, 0);
      const due = Math.max(0, res.monthlyRent - paidAlready);
      setCustomAmount(due > 0 ? due : res.monthlyRent);
      setShowPaymentModal(true);
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResident || customAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      recordPayment({
        residentId: targetResident.id,
        billingMonth,
        totalDueForMonth: targetMonthlyRent,
        amountPaid: customAmount,
        paymentType,
        paymentMethod,
        transactionReference: txnRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setShowPaymentModal(false);
      setTxnRef('');
      setNotes('');
      onClearInitialResidentId?.();
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Payment ID',
      'Resident ID',
      'Resident Name',
      'Room',
      'Bed',
      'Billing Month',
      'Type',
      'Amount Paid',
      'Remaining Balance',
      'Method',
      'Status',
      'Transaction Ref',
      'Date',
    ];

    const rows = payments.map((p) => [
      p.id,
      p.residentId,
      p.residentName,
      p.roomNumber,
      p.bedNumber,
      p.billingMonth,
      p.paymentType,
      p.amountPaid,
      p.remainingBalance,
      p.paymentMethod,
      p.status,
      p.transactionReference || '',
      formatDate(p.paidAt),
    ]);

    exportToCsv(`abc_def_pg_payments_${Date.now()}`, headers, rows);
  };

  return (
    <div id="payments-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Fees & Payments
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full, partial & custom payment collection for {currentMonth}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-payments-csv-btn"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="record-payment-btn"
            onClick={() => {
              const firstDue = duesRoster.find((d) => d.status !== 'PAID');
              if (firstDue) handleOpenPaymentFor(firstDue.resident.id);
              else if (residents[0]) handleOpenPaymentFor(residents[0].id);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Expected Rent ({currentMonth})
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {formatCurrency(expectedCollection)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">{activeResidents.length} active residents</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Collected Amount
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-emerald-700">
            {formatCurrency(collectedAmount)}
          </span>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            {expectedCollection > 0 ? Math.round((collectedAmount / expectedCollection) * 100) : 0}% cleared
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block mb-1">
            Total Outstanding Due
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-rose-700">
            {formatCurrency(totalDue)}
          </span>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            {duesRoster.filter((d) => d.remainingDue > 0).length} residents pending
          </p>
        </div>
      </div>

      {/* Tabs: Dues Roster vs History */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('DUES')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition ${
              activeTab === 'DUES'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resident Dues ({duesRoster.filter((d) => d.remainingDue > 0).length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment History Ledger ({payments.length})
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search resident or txn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Tab Content: Dues Roster */}
      {activeTab === 'DUES' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Resident</th>
                  <th className="p-3.5">Room & Bed</th>
                  <th className="p-3.5">Monthly Fee</th>
                  <th className="p-3.5">Paid So Far</th>
                  <th className="p-3.5">Balance Due</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {duesRoster
                  .filter((d) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      d.resident.fullName.toLowerCase().includes(q) ||
                      d.resident.roomNumber.toLowerCase().includes(q) ||
                      d.resident.id.toLowerCase().includes(q)
                    );
                  })
                  .map((item) => (
                    <tr key={item.resident.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.resident.photoUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-semibold text-slate-800">{item.resident.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.resident.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        Room {item.resident.roomNumber} • Bed {item.resident.bedNumber}
                      </td>

                      <td className="p-3.5 font-bold text-slate-800">
                        {formatCurrency(item.monthlyRent)}
                      </td>

                      <td className="p-3.5 font-medium text-emerald-700">
                        {formatCurrency(item.amountPaid)}
                      </td>

                      <td className="p-3.5 font-bold text-rose-600">
                        {formatCurrency(item.remainingDue)}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.status === 'PAID'
                            ? 'Paid'
                            : item.status === 'PARTIAL'
                            ? 'Partially Paid'
                            : 'Unpaid / Due'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenPaymentFor(item.resident.id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition"
                        >
                          {item.status === 'PAID' ? 'Record Extra' : 'Collect Fee'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab Content: History Ledger */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Payment ID</th>
                  <th className="p-3.5">Resident</th>
                  <th className="p-3.5">Billing Month</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Amount Paid</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments
                  .filter((p) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      p.residentName.toLowerCase().includes(q) ||
                      p.id.toLowerCase().includes(q) ||
                      (p.transactionReference && p.transactionReference.toLowerCase().includes(q))
                    );
                  })
                  .map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{payment.id}</td>

                      <td className="p-3.5 font-medium text-slate-800">
                        <div>
                          <p>{payment.residentName}</p>
                          <p className="text-[10px] text-slate-400">
                            Room {payment.roomNumber} ({payment.bedNumber})
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700">{payment.billingMonth}</td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {payment.paymentType}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-emerald-700 text-sm">
                        {formatCurrency(payment.amountPaid)}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500">{formatDate(payment.paidAt)}</td>

                      <td className="p-3.5 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                        {payment.transactionReference || payment.notes || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal (Supports Full, Partial, or Custom Amount) */}
      {showPaymentModal && targetResident && (
        <div
          id="record-payment-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200/60">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Fee Payment</h3>
                <p className="text-xs text-slate-500">Supports Full, Partial & Custom Amounts</p>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              {/* Resident selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resident</label>
                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {activeResidents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} — Room {r.roomNumber} ({r.bedNumber}) • {formatCurrency(r.monthlyRent)}/mo
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Month & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Billing Period</label>
                  <select
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="August 2026">August 2026</option>
                    <option value="September 2026">September 2026</option>
                    <option value="October 2026">October 2026</option>
                    <option value="Security Deposit">Security Deposit</option>
                    <option value="Maintenance / Other">Maintenance / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Category</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Rent">Monthly Rent</option>
                    <option value="Security Deposit">Security Deposit</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other Charge</option>
                  </select>
                </div>
              </div>

              {/* Fee Breakdown Box with Dynamic Remaining calculation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Monthly Fee:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(targetMonthlyRent)}</span>
                </div>

                {/* Amount Received Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Amount Received (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      step={100}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-indigo-300 rounded-xl font-bold text-base text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCustomAmount(targetMonthlyRent)}
                    className="flex-1 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700"
                  >
                    Full ({formatCurrency(targetMonthlyRent)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAmount(Math.round(targetMonthlyRent / 2))}
                    className="flex-1 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700"
                  >
                    Half ({formatCurrency(Math.round(targetMonthlyRent / 2))})
                  </button>
                </div>

                {/* Remaining Balance Indicator */}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="font-semibold text-slate-600">Remaining Balance:</span>
                  <span
                    className={`font-bold ${
                      Math.max(0, targetMonthlyRent - customAmount) === 0
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {Math.max(0, targetMonthlyRent - customAmount) === 0
                      ? '₹0 (Paid in Full ✓)'
                      : formatCurrency(Math.max(0, targetMonthlyRent - customAmount))}
                  </span>
                </div>
              </div>

              {/* Payment Method & Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UPI Ref / Txn ID (Optional)
                  </label>
                  <input
                    placeholder="e.g. UPI-9812401"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Note (Optional)</label>
                <input
                  placeholder="e.g. Balance promised by 20th August"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Save & Send Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
