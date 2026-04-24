// 방 코드 생성 — 6자리 영숫자 (혼동 방지: 0/O, 1/I/L 제외)
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length: number = 6): string {
  let code = "";
  const arr = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    code += CHARS[arr[i] % CHARS.length];
  }
  return code;
}
