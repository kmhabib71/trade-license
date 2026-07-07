import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary helper. All assets live under CLOUDINARY_FOLDER (default
 * `trade-license`), namespaced per tenant so uploads stay isolated.
 */

let configured = false;
function ensureConfig() {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars are not set. Check .env.local");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || "trade-license";

export interface UploadResult {
  url: string; // secure_url
  publicId: string;
  resourceType: string; // "image" | "raw" (pdf)
  format?: string;
  width?: number;
  height?: number;
  bytes: number;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param subfolder e.g. `licenses` | `owner-photos`
 * @param tenantId  used to namespace: <root>/<tenantId>/<subfolder>
 */
export async function uploadBuffer(
  buffer: Buffer,
  opts: { tenantId: string; subfolder: string; filename?: string },
): Promise<UploadResult> {
  ensureConfig();
  const folder = `${ROOT_FOLDER}/${opts.tenantId}/${opts.subfolder}`;

  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // handles image + pdf (raw)
        use_filename: Boolean(opts.filename),
        filename_override: opts.filename,
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

/** Delete an asset (used when replacing / removing a license image). */
export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "raw" = "image",
): Promise<void> {
  ensureConfig();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
