export const uploadImageToCloudinary = async (image: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", image);

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Failed to upload image";
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload?.url) {
    throw new Error("Upload succeeded but no image url was returned");
  }

  return payload.url;
};
