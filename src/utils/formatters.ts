import type { OrderStatus, PaymentStatus, PaymentMethod } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTimeOnly(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function getOrderStatusConfig(status: OrderStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'menunggu':
      return {
        label: 'Menunggu Konfirmasi',
        bg: 'bg-[#FDF3E5]',
        text: 'text-[#C67D26]',
        border: 'border-[#F0CBA0]',
      };
    case 'diproses':
      return {
        label: 'Sedang Diracik',
        bg: 'bg-[#EAF2F7]',
        text: 'text-[#3F647E]',
        border: 'border-[#BCD3E3]',
      };
    case 'siap_diantar':
      return {
        label: 'Siap Diantar',
        bg: 'bg-[#EFE8FA]',
        text: 'text-[#6C4299]',
        border: 'border-[#D4C3EC]',
      };
    case 'selesai':
      return {
        label: 'Selesai',
        bg: 'bg-[#E8F2EA]',
        text: 'text-[#3D784E]',
        border: 'border-[#B8D8BF]',
      };
    case 'dibatalkan':
      return {
        label: 'Dibatalkan',
        bg: 'bg-[#FCEBEB]',
        text: 'text-[#B83E3E]',
        border: 'border-[#F0B8B8]',
      };
    default:
      return {
        label: status,
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-300',
      };
  }
}

export function getPaymentStatusConfig(status: PaymentStatus): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Belum Bayar',
        bg: 'bg-[#FDF3E5]',
        text: 'text-[#C67D26]',
        border: 'border-[#F0CBA0]',
      };
    case 'paid':
      return {
        label: 'Lunas',
        bg: 'bg-[#E8F2EA]',
        text: 'text-[#3D784E]',
        border: 'border-[#B8D8BF]',
      };
    case 'cancelled':
      return {
        label: 'Batal',
        bg: 'bg-[#FCEBEB]',
        text: 'text-[#B83E3E]',
        border: 'border-[#F0B8B8]',
      };
    default:
      return {
        label: status,
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-300',
      };
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return method === 'qris' ? 'QRIS Pembayaran Digital' : 'Tunai / Cash di Kasir';
}
