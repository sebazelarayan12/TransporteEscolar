import { PriceInput } from '../../shared/ui/PriceInput';
import { fieldAriaProps, fieldInputClass } from '../../shared/utils/form-field.helpers';

interface MontoMensualInputProps {
  id: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  disabled: boolean;
  error?: string;
  required?: boolean;
}

/** Input de monto mensual pactado, pensado para usarse dentro del `render` de un `Controller`. */
export const MontoMensualInput = ({ id, value, onChange, onBlur, disabled, error, required }: MontoMensualInputProps) => (
  <PriceInput
    id={id}
    value={value ?? ''}
    onValueChange={(cleanValue: string, floatValue: number | undefined) => {
      onChange(cleanValue ? floatValue : undefined);
    }}
    onBlur={onBlur}
    disabled={disabled}
    placeholder="0,00"
    prefix="$"
    containerClassName="relative"
    inputClassName={fieldInputClass(Boolean(error), 'price')}
    aria-required={required ? 'true' : undefined}
    {...fieldAriaProps(id, error)}
  />
);
