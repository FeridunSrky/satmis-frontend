import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

export async function chooseOption(user: UserEvent, label: string, option: string) {
  // Catalog options arrive asynchronously, as they would for a real user
  await screen.findByRole('option', { name: option });
  await user.selectOptions(screen.getByRole('combobox', { name: label }), option);
}

/** Every required field except the images, with values the catalog mock knows. */
export async function fillListingFields(user: UserEvent) {
  await user.type(screen.getByLabelText('Başlık'), 'Hatasız 2019 Clio');
  await user.type(screen.getByLabelText('Fiyat'), '650000,50');
  await chooseOption(user, 'Marka', 'Renault');
  await chooseOption(user, 'Model', 'Clio');
  await chooseOption(user, 'Seri', '1.0 TCe');
  await user.type(screen.getByLabelText('Model yılı'), '2019');
  await user.type(screen.getByLabelText('Kilometre'), '85000');
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
