import { http } from '@/shared/api/http';
import type { ImageUpload, ImageUploadRequest, UploadedImage } from '../types';

// The file itself never goes through the API: these calls only reserve, confirm and discard it

export async function requestImageUpload(request: ImageUploadRequest): Promise<ImageUpload> {
  const response = await http.post<ImageUpload>('/listing-images', request);
  return response.data;
}

export async function completeImageUpload(imageId: number): Promise<UploadedImage> {
  const response = await http.post<UploadedImage>(`/listing-images/${imageId}/complete`);
  return response.data;
}

export async function deleteImageUpload(imageId: number): Promise<void> {
  await http.delete(`/listing-images/${imageId}`);
}
