'use client';

import { AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  isLoading?: boolean;
}

const variantConfig = {
  default: {
    icon: Info,
    iconClass: 'text-blue-500 bg-blue-50',
    confirmClass: 'bg-primary hover:bg-primary/90',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500 bg-amber-50',
    confirmClass: 'bg-amber-500 hover:bg-amber-600',
  },
  danger: {
    icon: AlertTriangle,
    iconClass: 'text-red-500 bg-red-50',
    confirmClass: 'bg-red-500 hover:bg-red-600',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-500 bg-green-50',
    confirmClass: 'bg-green-500 hover:bg-green-600',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="p-6">
          {/* Icon */}
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
            config.iconClass
          )}>
            <Icon className="h-6 w-6" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
              config.confirmClass
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
