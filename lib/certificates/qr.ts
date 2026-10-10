import QRCode from "qrcode";

export async function createQrPng(url: string): Promise<Uint8Array> {
  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    margin: 1,
    width: 256,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0b1b4a",
      light: "#ffffff",
    },
  });
  return new Uint8Array(buffer);
}
