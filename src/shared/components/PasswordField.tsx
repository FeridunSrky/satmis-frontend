import { useState } from 'react';
import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-pressed={isVisible}
          aria-label={`${props.label}: ${isVisible ? 'gizle' : 'göster'}`}
          className="mr-1 h-9 shrink-0 rounded px-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          {isVisible ? 'Gizle' : 'Göster'}
        </button>
      }
    />
  );
}
