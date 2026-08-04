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

export function getPublicAppUrl(overrideUrl?: string): string {
  if (overrideUrl && !overrideUrl.includes("localhost") && !overrideUrl.includes("127.0.0.1")) {
    return overrideUrl.replace(/\/$/, "");
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }

  if (
    typeof window !== "undefined" &&
    window.location.origin &&
    !window.location.origin.includes("localhost") &&
    !window.location.origin.includes("127.0.0.1")
  ) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "https://asset-portal.protectolonline.com";
}

export function getAssetQRContent(assetTag: string, assetId?: string, appUrl?: string): string {
  const baseUrl = getPublicAppUrl(appUrl);
  if (assetId) {
    return `${baseUrl}/scan/${assetId}`;
  }
  return assetTag;
}

export function sanitizeQRText(qrText: string | null | undefined, assetTag: string, assetId: string): string {
  if (!qrText || qrText.includes("localhost") || qrText.includes("127.0.0.1")) {
    return getAssetQRContent(assetTag, assetId);
  }
  return qrText;
}
