import QRCode from "qrcode";

export async function generateQRDataURL(text: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: options?.width || 256,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      ...options,
    });
  } catch (err) {
    console.error("Failed to generate QR code:", err);
    throw new Error("Failed to generate QR code");
  }
}

export function getAssetQRContent(assetTag: string, assetId?: string, appUrl?: string): string {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (assetId) {
    return `${baseUrl}/assets/${assetId}`;
  }
  return assetTag;
}
