/**
 * Browser-side unsigned upload to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded asset.
 *
 * Requires:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (must be configured as "Unsigned" in Cloudinary)
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary env vars missing");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Cloudinary upload failed (${res.status})`);
    }

    const data = (await res.json()) as { secure_url?: string };
    if (!data.secure_url) {
        throw new Error("Cloudinary response missing secure_url");
    }
    return data.secure_url;
}
