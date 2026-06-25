import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "lexdata-media";

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

export async function uploadImageFromFormData(
  formData: FormData,
  fieldName: string,
  folder: string
) {
  const file = formData.get(fieldName);

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Image must be smaller than 5MB.");
  }

  const supabase = await createClient();

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${folder}/${cleanFileName(fileName)}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}