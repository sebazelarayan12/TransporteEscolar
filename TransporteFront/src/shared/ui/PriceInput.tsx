import { NumericFormat, type NumberFormatValues } from 'react-number-format';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

type BaseInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onInput' | 'inputMode' | 'prefix'
>;

interface PriceInputProps extends BaseInputProps {
  value?: string | number | null;
  defaultValue?: string | number;
  onValueChange?: (value: string, floatValue: number | undefined) => void;
  prefix?: ReactNode;
  allowNegative?: boolean;
  decimalScale?: number;
  containerClassName?: string;
  inputClassName?: string;
  error?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export const PriceInput = ({
  value,
  defaultValue,
  onValueChange,
  onBlur,
  onFocus,
  name,
  id,
  placeholder,
  disabled,
  prefix = '$',
  allowNegative = false,
  decimalScale,
  containerClassName,
  inputClassName,
  error,
  inputRef,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: PriceInputProps) => {
  const handleValueChange = (values: NumberFormatValues) => {
    onValueChange?.(values.value, values.floatValue);
  };

  const baseInputClasses = `w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1d8ca5] dark:border-[#3f3f46] dark:bg-[#27272a] dark:text-white`;
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 dark:border-red-500' : 'border-gray-200';
  const prefixPadding = prefix ? 'pl-8' : '';
  const composedInputClassName = `${baseInputClasses} ${errorClasses} ${prefixPadding} ${inputClassName ?? ''}`
    .replace(/\s+/g, ' ')
    .trim();

  const isControlled = value !== undefined;
  const normalizedValue = value ?? '';
  const numericProps = isControlled ? { value: normalizedValue } : { defaultValue };

  return (
    <div className={`relative ${containerClassName ?? ''}`}>
      {prefix ? (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
          {prefix}
        </span>
      ) : null}
      <NumericFormat
        {...numericProps}
        {...rest}
        id={id}
        name={name}
        disabled={disabled}
        placeholder={placeholder}
        thousandSeparator="."
        decimalSeparator="," 
        allowNegative={allowNegative}
        decimalScale={decimalScale}
        inputMode="decimal"
        className={composedInputClassName}
        getInputRef={inputRef}
        onBlur={onBlur}
        onFocus={onFocus}
        onValueChange={handleValueChange}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
    </div>
  );
};
