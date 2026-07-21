import { Platform } from 'react-native';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function appendFileToFormData(formData: FormData, field: string, file: PickedFile) {
  if (Platform.OS === 'web') {
    const res = await fetch(file.uri);
    const blob = await res.blob();
    formData.append(field, blob, file.name);
  } else {
    formData.append(field, {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }
}
