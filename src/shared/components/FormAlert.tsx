interface FormAlertProps {
  message?: string;
}

export function FormAlert({ message }: FormAlertProps) {
  if (!message) {
    return null;
  }
  return (
    <div
      role="alert"
      className="rounded-md border-l-4 border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
    >
      {message}
    </div>
  );
}
