const CLOUDINARY_CLOUD_NAME = 'dugkhwso5';
const CLOUDINARY_UPLOAD_PRESET = 'busway_perfiles';

export const subirFotoACloudinary = async (imagenBase64) => {
  const formData = new FormData();
  formData.append('file', imagenBase64);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error('No se pudo subir la imagen a Cloudinary');
  }

  return data.secure_url;
};