export interface IconProps {
  className?: string;
}

interface IconBaseProps extends IconProps {
  glyph: string;
}

const baseClassName = 'material-symbols-outlined leading-none';

export const IconBase = ({ glyph, className = '' }: IconBaseProps) => {
  return (
    <span aria-hidden="true" className={`${baseClassName} ${className}`}>
      {glyph}
    </span>
  );
};
