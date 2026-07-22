'use client';

import { ReactNode } from 'react';

interface RequiredFieldWrapperProps {
  fieldKey: string;
  label: string;
  error: boolean;
  registerFieldRef: (key: string, el: HTMLDivElement | null) => void;
  children: ReactNode;
  className?: string;
}

const RequiredFieldWrapper = ({
  fieldKey,
  label,
  error,
  registerFieldRef,
  children,
  className = '',
}: RequiredFieldWrapperProps) => {
  return (
    <div
      ref={(el) => registerFieldRef(fieldKey, el)}
      className={`${className} ${
        error ? 'rounded-lg border-2 border-red-400 bg-red-50/40 p-3' : ''
      }`}
    >
      {children}
      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">Please select: {label}</p>
      )}
    </div>
  );
};

export default RequiredFieldWrapper;
