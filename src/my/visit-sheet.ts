// 현장 시연용 공개 통합문서 두 종에서 첫 시트의 원시 입력 셀만 읽습니다.
// 압축된 XML의 크기를 제한하고 매크로·수식·외부 연결은 실행하지 않습니다.
const XML_LIMIT = 1024 * 1024;
const SHEET_PATH = "xl/worksheets/sheet1.xml";
const readXml = async (blob: Blob, path: string): Promise<Document | undefined> => {
  const bytes = await blob.arrayBuffer();
  const view = new DataView(bytes);
  const u16 = (offset: number): number => view.getUint16(offset, true);
  const u32 = (offset: number): number => view.getUint32(offset, true);
  let end = bytes.byteLength - 22;
  while (end >= Math.max(0, bytes.byteLength - 65557) && u32(end) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.byteLength - 65557)) throw new Error("정상 XLSX 통합문서를 선택해 주세요.");
  let offset = u32(end + 16);
  for (let entry = 0; entry < u16(end + 10); entry++) {
    if (u32(offset) !== 0x02014b50) throw new Error("통합문서의 시트 목록을 읽지 못했습니다.");
    const nameLength = u16(offset + 28);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    if (name === path) {
      const compressed = u32(offset + 20);
      const size = u32(offset + 24);
      const local = u32(offset + 42);
      const start = local + 30 + u16(local + 26) + u16(local + 28);
      if (size > XML_LIMIT || start + compressed > bytes.byteLength || (u16(offset + 8) & 1)) throw new Error("지원하는 시트 용량 또는 보관 형식을 확인해 주세요.");
      const part = blob.slice(start, start + compressed);
      const method = u16(offset + 10);
      if (method !== 0 && method !== 8) throw new Error("지원하지 않는 시트 압축 형식입니다.");
      const stream = method === 0 ? part.stream() : part.stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let total = 0;
      let xml = "";
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        total += chunk.value.byteLength;
        if (total > size || total > XML_LIMIT) { await reader.cancel(); throw new Error("시트 크기를 확인해 주세요."); }
        xml += decoder.decode(chunk.value, { stream: true });
      }
      const parsed = new DOMParser().parseFromString(xml + decoder.decode(), "application/xml");
      if (total !== size || parsed.querySelector("parsererror")) throw new Error("시트 XML을 읽을 수 없습니다.");
      return parsed;
    }
    offset += 46 + nameLength + u16(offset + 30) + u16(offset + 32);
  }
  return undefined;
};
export const readVisitSheet = async (file: Blob): Promise<(address: string) => string> => {
  const [sheet, strings] = await Promise.all([readXml(file, SHEET_PATH), readXml(file, "xl/sharedStrings.xml")]);
  if (!sheet) throw new Error("시연용 XLSX의 첫 번째 시트를 확인해 주세요.");
  return (address: string): string => {
    const cell = sheet.querySelector(`c[r="${address}"]`);
    if (cell?.querySelector("f")) throw new Error("입력 칸에 수식이 있습니다. 원값을 확인해 주세요.");
    const value = cell?.querySelector("v")?.textContent ?? "";
    if (cell?.getAttribute("t") === "s") return strings?.querySelectorAll("si")[Number(value)]?.textContent?.trim() ?? "";
    return (cell?.querySelector("is")?.textContent ?? value).trim();
  };
};
