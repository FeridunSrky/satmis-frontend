import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

export async function chooseOption(user: UserEvent, label: string, option: string) {
  // Catalog options arrive asynchronously, as they would for a real user. Label and text queries
  // instead of role queries: computing accessible names over the whole form is several times slower
  const select = screen.getByLabelText(label);
  await within(select).findByText(option);
  await user.selectOptions(select, option);
}

// Pasting instead of typing: every keystroke re-renders the whole form, and on a loaded machine
// a key-by-key fill alone could use up most of the test timeout
async function enterText(user: UserEvent, label: string, text: string) {
  await user.click(screen.getByLabelText(label));
  await user.paste(text);
}

/** Every required field except the images, with values the catalog mock knows. */
export async function fillListingFields(user: UserEvent) {
  await enterText(user, 'Başlık', 'Hatasız 2019 Clio');
  await enterText(user, 'Fiyat', '650000,50');
  await chooseOption(user, 'Marka', 'Renault');
  await chooseOption(user, 'Model', 'Clio');
  await chooseOption(user, 'Seri', '1.0 TCe');
  await enterText(user, 'Model yılı', '2019');
  await enterText(user, 'Kilometre', '85000');
  await user.selectOptions(screen.getByLabelText('Yakıt'), 'Benzin');
  await user.selectOptions(screen.getByLabelText('Vites'), 'Manuel');
  await chooseOption(user, 'İl', 'İstanbul');
  await chooseOption(user, 'İlçe', 'Kadıköy');
}

export async function pickPhotos(user: UserEvent, photos: File[]) {
  await user.upload(screen.getByLabelText('Görsel seç'), photos);
}

export async function waitForUploadsToSettle() {
  await waitFor(() => expect(screen.queryByText(/Görseller yükleniyor/)).not.toBeInTheDocument());
}
