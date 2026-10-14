import React from 'react';
import type { OrderStatus, PaymentStatus } from '../../types';
import { getOrderStatusConfig, getPaymentStatusConfig } from '../../utils/formatters';

interface OrderBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const OrderBadge: React.FC<OrderBadgeProps> = ({ status, size = 'md' }) => {
  const config = getOrderStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  );
};

interface PaymentBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status, size = 'md' }) => {
  const config = getPaymentStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};
