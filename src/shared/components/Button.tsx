import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { buttonClassName, type ButtonStyleOptions } from './buttonStyles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClassName({ variant, size, fullWidth }), className)}
      {...buttonProps}
    />
  );
}

type ButtonLinkProps = LinkProps & ButtonStyleOptions;

export function ButtonLink({ variant, size, fullWidth, className, ...linkProps }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonClassName({ variant, size, fullWidth }), className)} {...linkProps} />
  );
}
