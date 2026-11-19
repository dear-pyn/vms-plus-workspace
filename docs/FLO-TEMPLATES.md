# FLO Templates — product MTD (maintain-d)

คู่มือเต็มสำหรับเขียนและติดตามการ์ดใน FLO · กฎย่อสำหรับ AI: [`FLO-AGENT-INSTRUCTIONS.md`](FLO-AGENT-INSTRUCTIONS.md)
สองไฟล์นี้ต้องตรงกันเสมอ — แก้ไฟล์หนึ่งให้แก้อีกไฟล์ในการเปลี่ยนเดียวกัน

| ส่วน | หัวข้อ |
| --- | --- |
| A. ระบบ | 1 หลักการ · 2 เลขและชื่อการ์ด · 3 Field · 4 Column และ gate · 5 Tag |
| B. Template | 6 Epic · 7 Story · 8 Bug · 9 Technical · 10 Subtask · 11 Comment |
| C. ติดตามงาน | 12 Epic summary · 13 Health check · 14 คำสั่งสั้นกับ AI |

---

# A. ระบบ

## 1. หลักการ

1. **หนึ่งเรื่อง หนึ่งที่** — สถานะอยู่ในบล็อกสถานะ · AC อยู่ในตาราง AC · การยืนยันอยู่ใน Confirmation log · ไม่ซ้ำที่อื่น
2. **ข้อเท็จจริงล่าสุดอยู่ใน description** — comment คือประวัติ ข้อตกลงใหม่ต้องแก้ description วันเดียวกัน
3. **ระบบออกเลข คนไม่ตั้งเลข** — เลขการ์ด = `MTD-<n>`
4. **ไม่มีข้อมูล = เขียนว่าไม่มี** — "ยังไม่มี" หรือเปิด OQ ห้ามเดา
5. **แยก confirmed / observed / pending** — ยืนยันแล้วต้องมีแถวใน Confirmation log พร้อมหลักฐาน
6. **AI รายงานก่อน แก้เมื่อสั่ง** — ย้าย column, assign, archive, trash ทำเมื่อคนสั่งเท่านั้น

## 2. เลขและชื่อการ์ด

| ระดับ | Type ใน FLO | เลข | Title | ตัวอย่าง title |
| --- | --- | --- | --- | --- |
| UC ในใบ JO | `Epic` | `MTD-<n>` | `[JO<n>-UC<nn>] <ชื่อ UC>` | `[JO1-UC24] Overhaul — ขั้นตอนยานพาหนะ` |
| งานที่ผู้ใช้เห็น | `Feature` | `MTD-<n>` | `<role> <ทำอะไร>` | `กบค. นำรถเข้าอู่แบบไม่มีการนัดหมาย` |
| ข้อบกพร่อง | `Bug` | `MTD-<n>` | `<อาการ> — <ที่ไหน>` | `ปีในหมายเลขแผนเปลี่ยนตามปีงบประมาณ — หน้าสร้างแผน` |
| งานเทคนิค | `Technical` | `MTD-<n>` | `<ทำอะไร> <เพื่ออะไร>` | `ขยับ Go 1.26.11 แก้ช่องโหว่ HIGH ใน image BE` |
| งานย่อย | subtask | `MTD-<n>` | `[BA\|UX\|DEV\|BE\|FE\|QA\|PO] <งาน>` | `[QA] Execute SIT TCM` |
| ภายในการ์ด | — | `AC-nn` `EC-nn` `TC-nn` `OQ-nn` `CH-nn` | — | `AC-08` |

กติกา:
- ไม่รู้ UC → `[JO?] <ชื่อ>` + tag `Open questions` · ห้ามเดาเลข JO/UC
- ห้ามใส่ sprint, ทีม, สถานะ, epic, `[PEA]`, `[Scenario n]` ใน title — อยู่ใน field แล้ว และ sprint เปลี่ยนได้
- ID ภายในการ์ดไม่เปลี่ยนเลข · เลขที่ถอดแล้วย้ายไปตาราง "ถอดออก" ห้ามใช้ซ้ำ
- Branch `feat/MTD-<n>-<slug>` · `fix/MTD-<n>-<slug>` · `chore/MTD-<n>-<slug>` · commit `type(scope): subject (MTD-<n>)`
- ข้อในใบ JO → story: บรรทัด `อ้างอิง JO:` ในบล็อกสถานะ + ตาราง Coverage ของ epic
- Regex ตรวจ: epic `^\[JO(\d+-UC\d{2}|\?)\] ` · branch `^(feat|fix|chore)/MTD-\d+-`

เหตุผลที่ใช้ `MTD-<n>` แทน `PEA-<JO>.<UC>.<running>`: ไม่ต้องมีคนออกเลข (ไม่มี `??` ไม่มีเลขชน) · AI เห็นชื่อ branch แล้วเปิดการ์ดได้ทันที · ย้าย epic ได้โดยเลขไม่เปลี่ยน · แบบเดียวกับ Jira / Linear / GitHub

## 3. Field

| Field | ตั้งตอนสร้าง | ใช้อย่างไร |
| --- | --- | --- |
| `title` | ✅ บังคับ | ตาม §2 |
| `type` | ✅ บังคับ | `Epic` `Feature` `Bug` `Technical` |
| `description` | ✅ | Markdown ตาม §6–9 |
| `epic` | ✅ | Feature และ Bug ต้องมี · Technical ไม่ต้อง |
| `tags` | ✅ | ตาม §5 เท่านั้น |
| `board` / `column` | ภายหลัง (`move_item`) | สร้างแล้วอยู่ backlog นอก board · สถานะมาจาก column |
| `sprint` | ตาม board | sprint อยู่ที่นี่ที่เดียว |
| `assignee` | ภายหลัง | เมื่อคนสั่ง |
| `estimate` | ภายหลัง | story points |
| `subtasks` | `add_subtask` | ตาม §10 |
| `related_items` | `add_related_item` | `blocks` `fixes` `duplicates` `relates to` · ห้ามเขียน "Related:" ใน description |
| `design_url` | — | ไม่ใช้ · ลิงก์ Figma อยู่ในหัวข้อ Sources |
| epic summary | `update_epic_summary` | ตาม §12 |

## 4. Column และ gate (board `Maintain-d`)

ลำดับ column ตามที่ทีมใช้จริง: dev เสร็จ → deploy ขึ้น UAT → QA เทสบน UAT

| # | Column | Stage | ย้ายเข้าได้เมื่อ |
| --- | --- | --- | --- |
| — | backlog (นอก board) | Brief → Prototype → Refinement → Customer confirm | สร้างการ์ด · แต่ละขั้นผ่านเมื่อมีแถวใน Confirmation log |
| 1 | To do | พร้อม build | AC ยืนยันแล้ว · contract ตกลงแล้ว · `รอ: ไม่มี` |
| 2 | In progress | Build | มีคนรับ + branch |
| 3 | Ready to deploy | Build เสร็จ รอขึ้น UAT | lint / type-check / test ผ่าน · comment ผลเทส local · merge แล้ว · migration / SQL pack พร้อม |
| 4 | Ready to test | อยู่บน UAT แล้ว | deploy UAT สำเร็จ · บล็อกสถานะระบุ build/sha ที่ขึ้น |
| 5 | Testing | QA | QA รับแล้ว |
| 6 | Defect | QA เจอ defect | มีการ์ด `Bug` ที่ `fixes` story นี้อย่างน้อย 1 ใบ · แก้แล้ว deploy ใหม่ → กลับ Ready to test |
| 7 | Done | QA ผ่าน | AC ทุกข้อ `[x]` พร้อมหลักฐาน · ไม่มี Bug เปิดที่ `fixes` · เรื่องค้างเปิดเป็นการ์ดใหม่แล้ว |

- งานก่อน To do (Discovery) อยู่บน board `Discovery` แยก — ดู §4.1
- Column Defect คือที่อยู่ของ **story** ที่มี bug เปิด · ตัว defect เองเป็นการ์ด `Bug` แยก (ผูก `fixes`) เพื่อให้นับและติดตามทีละใบได้
- Epic ไม่ขึ้น board · สถานะ epic ดูจาก epic summary

## 4.1 Discovery (board `Discovery` — ยังไม่ได้สร้าง รอเจ้าของงานอนุมัติ)

ปัญหา: งาน Brief → Customer confirm อยู่ใน backlog ไม่มี column ไม่มีใครเห็นว่าต้องทำอะไร ค้างที่ใคร
แก้: แยก board Discovery (kanban) · story เดินบน board นี้จนผ่าน gate แล้วย้ายไป `Maintain-d` / To do · board dev ไม่เปลี่ยน

```
Discovery board                                                       Maintain-d board
Inbox → Brief → Prototype → Refinement → รอ กฟภ. ยืนยัน → Ready for dev ──▶ To do → … → Done
```

| # | Column | ทำอะไร | ใครทำหลัก | ย้ายออกได้เมื่อ (gate) | หลักฐานที่ต้องมี |
| --- | --- | --- | --- | --- | --- |
| 1 | Inbox | รับเรื่องจากใบ JO / refinement / กฟภ. | PO | มี epic + `อ้างอิง JO` | บรรทัด อ้างอิง JO |
| 2 | Brief | เป้าหมาย, role, scenario, ขอบเขต, OQ | BA | เจ้าของงานยืนยันขอบเขต | แถว Confirmation log "Brief" |
| 3 | Prototype | ต้นแบบกดได้ + flow สั้น + ตรวจกับภาพระบบจริง | UX | ลูกค้ายืนยันหน้าตา การกด สิทธิ์ ผลลัพธ์ | แถว "Prototype" + ลิงก์ prototype |
| 4 | Refinement | AC/EC เต็ม, review UX/FE/BE/QA, contract, Figma | BA + Dev + QA | ความเสี่ยงตอบแล้วหรือเป็น OQ · AC ครบ | ตาราง AC + ผล review |
| 5 | รอ กฟภ. ยืนยัน | ส่ง AC/flow ให้ กฟภ. | PO | กฟภ. ยืนยัน · OQ ที่ block ตอบครบ | แถว "Customer confirm" พร้อมผู้ยืนยัน/วันที่/หลักฐาน |
| 6 | Ready for dev | รอ sprint planning | PO | ถูกเลือกเข้า sprint → ย้ายไป `Maintain-d` / To do | — |

ถอยกลับได้: ลูกค้าเปลี่ยน behavior → กลับ Prototype ยืนยันเฉพาะส่วนที่เปลี่ยน (บันทึก Change log)

**Subtask Discovery** — ใส่ทุก story ตอนเข้า Inbox ทำให้เห็นว่าต้องทำอะไร ใครทำ ค้างที่ไหน

| Subtask | เสร็จเมื่อ |
| --- | --- |
| `[BA] Brief` | หัวข้อ Sources, Goal, Out of Scope, OQ กรอกแล้ว |
| `[UX] Prototype` | ลิงก์ prototype + flow สั้นใน Sources |
| `[UX] Review ความเสี่ยง UX` | ผล senior-ux-review ใน comment |
| `[DEV] Review ความเสี่ยง FE/BE + contract` | ผล senior-dev-review + หัวข้อ 8 Contracts |
| `[QA] Review AC ทดสอบได้` | AC/EC ทุกข้อทดสอบได้ + หัวข้อ 9 ร่าง TC |
| `[PO] Customer confirm` | แถว Confirmation log "Customer confirm" |

**Deliverable Discovery ราย JO (TOR ข้อ 8.1)** — epic `[JO<n>] Discovery deliverables` หนึ่งใบต่อ JO · หนึ่งเอกสาร = หนึ่งการ์ด `Technical` บน board Discovery

| การ์ด | เสร็จเมื่อ |
| --- | --- |
| ร่างสถาปัตยกรรมองค์กร Low Level | ส่ง กฟภ. + แถว Confirmation log |
| Solution Architecture | 〃 |
| Timeline and Implementation Plan | 〃 |
| Requirement Specification | 〃 |
| Functional Requirements + Technical Specification | 〃 |
| UX/UI Design | 〃 |
| Test Plan | 〃 |
| รายละเอียดบุคลากร (ตำแหน่ง / คน / Man-day) | 〃 |

Coverage ของ epic นี้ = รายการเอกสารครบ 8 ข้อ → เห็นทันทีว่า JO นี้ Discovery ส่งอะไรแล้ว ขาดอะไร

ขนาด: epic นี้มีแค่ 8 การ์ด **ไม่ใส่ story ของ UC** — งาน discovery ราย UC อยู่ใน epic ของ UC นั้น (`[JO1-UCnn]`)
เอกสารแบ่งเป็น 2 แบบ:
- **ประกอบจาก UC** (Requirement Spec, FR + TS, UX/UI, Test Plan) — การ์ดเอกสารมีตาราง `UC | epic | story ที่ผ่าน Refinement | อยู่ในเอกสารแล้ว` เนื้อหามาจาก story ที่ผ่าน gate Refinement แล้ว การ์ดเอกสารทำแค่รวมเล่ม
- **ทั้ง JO** (Low Level, Solution Architecture, Timeline, บุคลากร) — เป็นงานจริงของการ์ดนั้นเอง

## 5. Tag (ชุดเดียว ห้ามสร้างเพิ่มเอง)

| Tag | ใช้เมื่อ | เอาออกเมื่อ |
| --- | --- | --- |
| `⭐️ Vaseline` / `❤️ Peidmerge` | ทีมที่รับ (ถามก่อนใส่) | — |
| `Open questions` | มี OQ ที่ block รอคำตอบจากคน (โผล่ใน Waiting on me) | OQ ที่ block ตอบครบ |
| `Customer confirm` | รอ กฟภ. ยืนยัน | มีแถว Confirmation log |
| `Carry-over` | ข้าม sprint | Done |

---

# B. Template

ทุก template: ใช้ชื่อหัวข้อตามนี้ · หัวข้อที่ไม่มีข้อมูลเขียน "ยังไม่มี" ไม่ลบหัวข้อ · วันที่ `DD/MM/25xx`
description ยาวเกินที่ FLO รับ → ย้ายหัวข้อ 4–9 ไป comment แรก ชื่อ `**ต่อ description (หัวข้อ 4–9)**` แล้วเขียนบรรทัดนั้นแทนไว้ใน description

## 6. Epic

Type `Epic` · ไม่ใส่ tag · ไม่ขึ้น board

```markdown
## สถานะ (อัปเดต DD/MM/25xx)

- Story: เสร็จ x / ทั้งหมด y · Coverage ขาด: n ข้อ
- รอ: ไม่มี | OQ-xx จาก <ใคร>
- อ้างอิง JO: <ใบ JO ข้อ…> หรือเว้นว่าง

## Sources

| รายการ | ค่า |
| --- | --- |
| Figma | [section <node-id>](<url>) หรือ ยังไม่มี |
| Refinement | <วันที่ / ลิงก์> |
| ผู้ใช้หลัก | <role> |

| เฟรม | ความหมาย |
| --- | --- |
| <X.1 ชื่อเฟรม> | <สิ่งที่จอนี้แสดง> |

## เป้าหมาย

<ประโยคเดียว: ผู้ใช้ทำอะไรได้เมื่อ epic นี้เสร็จ>

## สิ่งที่ต้องการ

1. <ความต้องการ>

## นอกขอบเขต

- <สิ่งที่ไม่ทำ> → <MTD-xx หรือ ยังไม่มีการ์ด>

## Acceptance Criteria

1. <เกณฑ์ที่ตรวจได้ระดับ epic>

## Acceptance Test

1. **<ชื่อเทส>** — <สภาพเริ่มต้น> → <ผลที่คาด>

## Coverage

| # | สิ่งที่ต้องการ | Story | Stage |
| --- | --- | --- | --- |
| 1 | <ข้อ 1> | MTD-xx | Build |
| 2 | <ข้อ 2> | ยังไม่มี story | — |

## Open Questions

| ID | สถานะ | รายละเอียด |
| --- | --- | --- |
| OQ-01 | ยังไม่ตอบ (block) | <คำถาม> — ตัวเลือก A) … B) … |
| OQ-02 | ตอบแล้ว DD/MM/25xx | <คำถาม> → **<คำตอบ>** (<ใคร>) |

## Change log

- DD/MM/25xx — สร้าง epic
```

ทุกข้อใน "สิ่งที่ต้องการ" ต้องมีแถวใน Coverage · แถว "ยังไม่มี story" = งานที่ขาด

## 7. Story

Type `Feature` · epic บังคับ · tag ทีม

```markdown
## สถานะ (อัปเดต DD/MM/25xx)

- Stage: Brief | Prototype | Refinement | Customer confirm | Build | QA | Done
- Gate: ผ่าน | ไม่ผ่าน | รอ — <เหตุผล / หลักฐาน>
- ถัดไป: <action 1 ข้อ> — <ใคร>
- รอ: ไม่มี | OQ-xx จาก <ใคร> | MTD-xx | API <ชื่อ>
- AC: x/y · EC: x/y · OQ ค้าง: n
- ยืนยันล่าสุด: <ขั้น> · <ผู้ยืนยัน> · <วันที่> · <หลักฐาน>
- อ้างอิง JO: <ใบ JO ข้อ…> หรือเว้นว่าง

## Sources

| รายการ | ค่า |
| --- | --- |
| Figma | <section / node หรือ ยังไม่มี (OQ-xx)> |
| Refinement | <วันที่ / ลิงก์> |
| Prototype | <วันที่ / ลิงก์> |
| ข้อตกลงกับเจ้าของงาน | <วันที่ / สรุป> |

**Scope:** fe | be | both · **Skills:** `go-backend`, `nextjs-frontend`, `react-19-compiler-conventions`, `testing-strategy`, `sec-audit-guard`, `thai-localization`
**หลักการ:** <กฎหลักของงานนี้ 1–2 ประโยค>

## Design

<path รูปใน repo หรือ "ใช้ UI เดิม แก้เฉพาะจุดที่ระบุ">

| ID | จอ | เปลี่ยน | คงเดิม | AC |
| --- | --- | --- | --- | --- |
| CH-01 | <จอ> | <สิ่งที่เปลี่ยน> | <สิ่งที่คงเดิม> | AC-xx |

## 0. Agent Preflight

- อ่าน `AGENTS.md` ของ repo และ skill ใน Scope
- Branch จาก `main` ชื่อ `feat/MTD-<n>-<slug>`
- **ห้าม commit หรือ push** จนกว่าคนจะอนุมัติ

**Decision owner:** BA / PM
**Test personas:** <role (`username`): ทำอะไรได้> · role อื่น: <view only / เข้าไม่ได้>

## 1. Goal

<ย่อหน้าเดียว>

## 2. Acceptance Criteria

Status: `[ ]` ยังไม่ผ่าน · `[x]` ผ่านและมี test/หลักฐาน · `merged` อยู่ใน main รอ AT บน dev

| ID | Status | กลุ่ม | ข้อความ |
| --- | --- | --- | --- |
| AC-01 | [ ] | BE | <เกณฑ์> |
| AC-02 | [ ] | FE | <เกณฑ์> |

**Edge Cases**

| ID | Status | ข้อความ |
| --- | --- | --- |
| EC-01 | [ ] | <กรณีขอบ> |

**ถอดออก (สงวน ID)**

| ID | เหตุผล | วันที่ |
| --- | --- | --- |

## 3. Out of Scope

- <สิ่งที่ไม่ทำ> → <MTD-xx หรือ ยังไม่มีการ์ด>

## 4. Files to Change

| Layer | ไฟล์ | Action | AC |
| --- | --- | --- | --- |
| BE | `<path>` | new / modify | AC-xx |

## 5. Reuse

- <component / util เดิมที่ใช้ซ้ำ>

## 6. Impact

| หัวข้อ | รายละเอียด |
| --- | --- |
| ตาราง DB | <table> |
| หน้าจอ | <screen> |
| Test เดิมที่อาจพัง | <files> |

## 7. Guardrails

- DB: ห้ามแก้ migration เดิม · migration ใหม่คู่ PEA SQL pack + rollback
- Security: ตรวจสิทธิ์ที่ BE · actor จาก token
- **ห้าม commit หรือ push** จนกว่าคนจะอนุมัติ

## 8. Contracts

| Method & Path | เปลี่ยนแปลง | หมายเหตุ |
| --- | --- | --- |

| Status | Code | เมื่อไร |
| --- | --- | --- |

## 9. Test Scenarios

| TC | AC/EC | ระดับ | พฤติกรรม |
| --- | --- | --- | --- |
| TC-01 | AC-01 | BE repository | <พฤติกรรม> |

## 10. Definition of Done

- AC และ EC ทุกข้อ `[x]` · TC ทุกข้อมี test
- `cd maintain-d-be && make test && make lint` และ `cd maintain-d-fe && pnpm lint && pnpm type-check && pnpm test` ผ่าน
- ไม่มี Bug เปิดที่ `fixes` การ์ดนี้

## Open Questions

| ID | สถานะ | รายละเอียด |
| --- | --- | --- |
| OQ-01 | ยังไม่ตอบ (block) / ยังไม่ตอบ / ตอบแล้ว DD/MM/25xx | <คำถาม> → <คำตอบ> |

## Confirmation log

| ขั้น | revision | ขอบเขตที่ยืนยัน | ผู้ยืนยัน | วันที่ | หลักฐาน | เรื่องค้าง |
| --- | --- | --- | --- | --- | --- | --- |

## Change log

- DD/MM/25xx — สร้างการ์ด
```

## 8. Bug

Type `Bug` · epic เดียวกับ story · `add_related_item fixes <story>` บังคับ · tag ทีม

```markdown
## สถานะ (อัปเดต DD/MM/25xx)

- Severity: High | Medium | Low
- Env: local | dev | SIT | UAT | PEA · build/commit: <sha>
- ถัดไป: <action> — <ใคร>
- AC ที่ไม่ผ่าน: <AC-xx ของ MTD-yy> หรือ ไม่มี AC รองรับ

## Steps

1. <ขั้นตอน>

## Actual result

<สิ่งที่เกิด> (ภาพ: ตัดข้อมูลส่วนบุคคลออก)

## Expected result

<สิ่งที่ควรเกิด + อ้าง AC / Figma>

## Fix

- สาเหตุ: <root cause>
- แก้ที่: `<path>` · branch `fix/MTD-<n>-<slug>`
- Test ที่เพิ่ม: <ชื่อ test>

## Change log

- DD/MM/25xx — เปิด bug
```

## 9. Technical

Type `Technical` · epic ไม่บังคับ

```markdown
## สถานะ (อัปเดต DD/MM/25xx)

- ถัดไป: <action> — <ใคร>
- รอ: ไม่มี | <อะไร>

## ทำไม

<ปัญหา / ความเสี่ยง + หลักฐาน (CVE, pipeline, log)>

## ทำอะไร

- <การเปลี่ยนแปลง>

## ตรวจอย่างไร

- <คำสั่ง / ผลที่คาด>

## Change log

- DD/MM/25xx — สร้างการ์ด
```

## 10. Subtask

`add_subtask` ใต้ story · ใช้กับงานที่คนรับต่างกันเท่านั้น · **AC ไม่ทำเป็น subtask** (AC อยู่ในตาราง §7 ที่เดียว)

| Title | ใช้เมื่อ |
| --- | --- |
| `[BE] <งาน>` / `[FE] <งาน>` | dev คนละคนรับ BE/FE |
| `[UX] <งาน>` | งาน design แยกคน |
| `[QA] Prepare SIT TCM` / `[QA] Execute SIT TCM` | ทุก story ที่ต้องผ่าน SIT |
| `[BA]` `[UX]` `[DEV]` `[QA]` `[PO]` ชุด Discovery | ทุก story บน board Discovery (§4.1) |

## 11. Comment มาตรฐาน

| ใช้เมื่อ | บรรทัดแรก | เนื้อหา | แล้วต้องแก้ใน description |
| --- | --- | --- | --- |
| ตอบคำถาม | `**เคลียร์ OQ-nn:** <คำถาม>` | `→ **<คำตอบ>** (<ใคร>, DD/MM/25xx)` | ตาราง OQ · บล็อกสถานะ · Change log · tag `Open questions` |
| เปลี่ยน AC/scope | `**เปลี่ยน AC:** <ID>` | เดิม → ใหม่ · เหตุผล · หลักฐาน | ตาราง AC · Change log |
| แตก story | `**แตก story แล้ว**` | รายการ MTD-xx | Coverage ของ epic |
| ผลเทส local | `**ผลเทส local (ก่อนส่ง QA)**` | Backend / Frontend / ยังต้องทำบน UAT | AC Status · บล็อกสถานะ |
| ผลตรวจ branch | ``## ผลตรวจ `<branch>` (<sha>) — DD/MM/25xx`` | ทำแล้ว / ยังขาด / ต้องให้เจ้าของงานตัดสิน | AC Status |
| ก่อนเขียน description ใหม่ทั้งก้อน | `**Backup description เดิม (DD/MM/25xx)**` | description เดิมทั้งหมด | — |

ทุกการเขียนส่ง `actor: {"model": "<model id>"}` · ไม่ลงชื่อผู้เขียนในข้อความ · เก็บบรรทัด `[attachment …]` ไว้ที่เดิม

---

# C. ติดตามงาน

## 12. Epic summary (ทุกสัปดาห์ ผ่าน `update_epic_summary`)

```markdown
**DD/MM** · เสร็จ x/y story · Bug เปิด n · เสี่ยง: ต่ำ | กลาง | สูง

- เสร็จสัปดาห์นี้: MTD-xx, MTD-yy
- ติด: MTD-zz รอ <อะไร> จาก <ใคร>
- ถัดไป: <1–3 ข้อ>
```

## 13. Health check

สั่ง **"เช็กสุขภาพ FLO MTD"** → AI ดึง `list_items` (detail), `get_board`, `get_epic_summary` ทุก epic แล้วตรวจ · **รายงานเท่านั้น ไม่แก้**

| # | กฎ | เสี่ยงอะไร |
| --- | --- | --- |
| H1 | Feature/Bug ไม่มี epic | ไม่รู้ว่าเป็นส่วนของอะไร |
| H2 | อยู่ backlog ไม่มี stage ในบล็อกสถานะ นานเกิน 3 วันทำการ | ตกหล่น |
| H3 | ไม่มีบล็อกสถานะ หรือ อัปเดตเก่ากว่า 3 วันทำการ (การ์ดบน board) | สถานะไม่จริง |
| H4 | `รอ:` ไม่ว่าง แต่ไม่มี tag / `blocks` / hold | รอแต่ไม่มีใครเห็น |
| H5 | อยู่ Done แต่ AC ยังไม่ `[x]` ครบ หรือมี Bug เปิดที่ `fixes` · อยู่ Defect แต่ไม่มี Bug เปิด | ผ่าน gate ทั้งที่ไม่ครบ / column ไม่ตรง |
| H6 | comment ใหม่กว่า Change log และมีคำว่า AC / เปลี่ยน / ตัดสิน / เคลียร์ | ข้อตกลงอยู่แค่ใน comment |
| H7 | Coverage ของ epic มีแถว "ยังไม่มี story" | requirement ขาด |
| H8 | epic summary ว่าง หรือเก่ากว่า 7 วัน | ไม่มีภาพรวม |
| H9 | บน board แต่ไม่มีคนรับผิดชอบ | ไม่มีเจ้าของ |
| H10 | scope ซ้ำกันใน epic เดียวกัน | ทำซ้ำ / ขัดกัน |
| H11 | title ผิด §2 (มี sprint, `[PEA-…]`, epic ไม่ตรง regex) | ค้น/เรียงไม่ได้ |
| H12 | Bug ไม่มี `fixes` | นับ defect ไม่ได้ |
| H13 | story บน board Discovery ไม่มี subtask Discovery ครบ 6 ตัว · หรืออยู่ column เดิมเกิน 5 วันทำการ | discovery ค้างโดยไม่มีใครเห็น |
| H14 | JO ที่เริ่มแล้วไม่มี epic `Discovery deliverables` หรือ Coverage เอกสารไม่ครบ 8 | ส่งมอบ Discovery ไม่ครบ |

คำตอบ:

```markdown
| กฎ | Item | เจอ | แนะนำ | ใครทำ |
| --- | --- | --- | --- | --- |
```

## 14. คำสั่งสั้นกับ AI

| พูดว่า | AI ทำ |
| --- | --- |
| สร้าง epic `[JO1-UC24]` … | §6 · ถามช่องที่ขาด · สร้างนอก board |
| สร้าง story ใต้ MTD-xx … | §7 · ถาม tag ทีม · แล้วเพิ่มแถว Coverage ของ epic |
| เปิด bug ของ MTD-xx … | §8 · ผูก `fixes` |
| สถานะ MTD-xx | อ่านบล็อกสถานะ + comment หลังวันที่อัปเดต · สรุป 5 บรรทัด |
| ปิด gate MTD-xx | ตรวจ §4 → ผ่าน/ไม่ผ่าน + หลักฐาน · ถามก่อนย้าย column |
| บันทึกคำตอบ OQ-xx ใน MTD-xx | §11 แถว "ตอบคำถาม" ครบทุกที่ |
| สรุป epic MTD-xx | อัปเดตสถานะ + Coverage ของ epic + §12 |
| เช็กสุขภาพ FLO MTD | §13 |
| สรุปให้ลูกค้า | ภาษาไทย ไม่มีศัพท์ภายใน: ตกลงอะไรแล้ว / รออะไร / นัดถัดไป |
