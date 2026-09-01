import { usePrivacyMode } from '../hooks/usePrivacyMode';
import { formatCurrency } from '../utils/currency.helpers';

interface AmountProps {
  value: number;
  className?: string;
}

export const Amount = ({ value, className }: AmountProps) => {
  const { hidden } = usePrivacyMode();

  return <span className={className}>{hidden ? '••••' : formatCurrency(value)}</span>;
};
