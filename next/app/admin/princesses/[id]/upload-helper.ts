// 클라이언트 사이드 이미지 업로드 헬퍼.
// 큰 이미지를 캔버스로 축소한 뒤 data URL로 변환해 /api/upload 에 전송.

const MAX_DIM = 1280;
const QUALITY = 0.82;

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

async function postDataUrl(dataUrl: string): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl })
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error ?? `업로드 실패 (${res.status})`);
  }
  return json.url as string;
}

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드 가능합니다");
  return postDataUrl(await fileToDataUrl(file));
}

const MAX_VIDEO_BYTES = 20_000_000;

function fileToRawDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsDataURL(file);
  });
}

export async function uploadVideo(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) throw new Error("영상 파일만 업로드 가능합니다");
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("영상은 20MB 이하만 업로드할 수 있어요");
  }
  return postDataUrl(await fileToRawDataUrl(file));
}

export async function uploadMedia(file: File): Promise<string> {
  if (file.type.startsWith("video/")) return uploadVideo(file);
  if (file.type.startsWith("image/")) return uploadImage(file);
  throw new Error("지원하지 않는 파일 형식이에요");
}

export function isVideoUrl(url: string): boolean {
  return url.startsWith("data:video/") || /\.(mp4|webm|mov)(\?|$)/i.test(url);
}
