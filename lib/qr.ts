import QRCode from "qrcode";

// Server-side QR generation. Returns a PNG data URI ready to drop into
// an <Image src=...> or <img> tag in the admin. High error-correction
// so a small logo overlay can be added later without breaking scanability.
export async function qrPngDataUri(
  data: string,
  opts: { size?: number; margin?: number } = {},
): Promise<string> {
  const size = opts.size ?? 512;
  const margin = opts.margin ?? 2;
  return await QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    type: "image/png",
    margin,
    width: size,
    color: { dark: "#09090b", light: "#ffffff" },
  });
}
