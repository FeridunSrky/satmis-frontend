import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Presses the confirm button of the open confirmation dialog, as a user would. */
export async function confirmDialog(user: UserEvent, confirmLabel: string | RegExp) {
  const dialog = await screen.findByRole('alertdialog');
  await user.click(within(dialog).getByRole('button', { name: confirmLabel }));
}
