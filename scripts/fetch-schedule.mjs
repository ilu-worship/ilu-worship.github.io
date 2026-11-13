// Notion 일정 DB에서 오늘 이후 "N월 찬양집회"만 골라 schedule.json에 이름·시작일만 저장
import { writeFileSync } from "node:fs";

const { NOTION_TOKEN, NOTION_DB_ID } = process.env;
if (!NOTION_TOKEN || !NOTION_DB_ID) throw new Error("NOTION_TOKEN / NOTION_DB_ID 필요");

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    filter: {
      and: [
        { property: "이름", title: { contains: "찬양집회" } },
        { property: "날짜", date: { on_or_after: today } },
      ],
    },
    sorts: [{ property: "날짜", direction: "ascending" }],
  }),
});
if (!res.ok) throw new Error(`Notion API ${res.status}: ${await res.text()}`); // 실패 시 기존 파일 유지

export const pick = (pages) =>
  pages
    .map((p) => ({
      name: p.properties["이름"].title.map((t) => t.plain_text).join("").trim(),
      start: p.properties["날짜"].date?.start,
    }))
    // 내부용 하위 항목(예: "9월 찬양집회 홍보미디어팀")이 공개되지 않도록 이름 형식을 엄격히 제한
    .filter((e) => e.start && /^\d{1,2}월 찬양집회$/.test(e.name));

const events = pick((await res.json()).results);
writeFileSync("schedule.json", JSON.stringify(events, null, 2) + "\n");
console.log(`${events.length}건 저장`);
