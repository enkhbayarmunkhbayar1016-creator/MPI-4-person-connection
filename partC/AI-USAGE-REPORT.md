# AI Usage Report — BIE-DAALT-13

**Огноо:** 2026-05-11  
**Хэрэглэсэн AI:** Claude Code (Anthropic claude-sonnet-4-6)  
**Нийт session:** 4+

---

## 1. Юу AI хийсэн, хүн өөрөө хийсэн?

### AI хийсэн:
- Server architecture design санал болгосон (namespace тусгаарлалт)
- `requireAuth` middleware бичсэн
- Socket.IO relay pattern (`attachServer` функц) бичсэн
- Test case бичихэд туслав (supertest ашиглах заасан)
- Dark mode flash засах арга (`<head>` дотор script) санал болгосон
- OpenAPI YAML бичихэд туслав

### Хүн өөрөө хийсэн:
- Сэдвийн сонголт (chat system)
- UI/UX дизайн шийдвэр (dark/light mode toggle, стикер систем)
- GIF жагсаалт цуглуулах
- Deploy хийх (Render.com тохиргоо)
- Bug debug хийх (Tenor GIF render, light mode flash)
- Commit message бичих

---

## 2. Hallucination ≥2 жишээ

### Жишээ 1 — Socket.IO room ашиглах санал
**Claude санал болгосон:**
```js
socket.to('chat-room').emit('message', msg);
```
**Бодит байдал:** `/server-a`, `/server-b` namespace ашигладаг тул room хэрэггүй. `ns.emit()` зөв.  
**Шийдэл:** Namespace-д room ашиглахгүй гэдгийг шалган засав.

### Жишээ 2 — JWT санал
**Claude санал болгосон:** `jsonwebtoken` package ашиглах.  
**Бодит байдал:** In-memory Map token нь энэ хэмжээний системд хангалттай, JWT нь нэмэлт complexity нэмнэ.  
**Шийдэл:** Simple token approach хэвээр үлдээв.

---

## 3. Security/license-ийн анхааруулга ≥1 жишээ

**AI-аас гарсан код:** GIF URL-г `<img src="${msg.text}">` дотор direct оруулах.  
**Security эрсдэл:** XSS боломжтой хэрэв `msg.text` нь user input байвал.  
**Шийдэл:** Tenor GIF URL-г hardcode жагсаалтаас авдаг тул user input биш — эрсдэл хязгаарлагдсан.

---

## 4. Юу AI-аар хурдан хийсэн? (production benefit)

- **Boilerplate code** — Express route, middleware, Socket.IO namespace setup
- **Test case generation** — 11 unit test 10 минутад
- **OpenAPI spec** — 220 мөрийн YAML автоматаар
- **Debug туслалцаа** — Light mode flash нь `<head>` script хэрэгтэй гэж тодорхойлсон

---

## 5. Юу AI-аар удаан хийсэн? (антипаттерн)

- **UI pixel-perfect засвар** — Claude текст хариулт өгдөг, CSS харуулж чадахгүй
- **Тестийн зорилго тодруулах** — AI тест бичсэн боловч бизнес логик ойлгохгүй байсан тул өөрөө засах шаардлагатай болсон
- **Deploy config** — Render.com-ын render.yaml тохиргоог AI мэдэхгүй байсан

---

## 6. Skill atrophy эрсдэл — өөрөө яаж зохицуулсан?

- Бүх AI-н санал болгосон кодыг **унших, ойлгох** зарчмаар хэрэгжүүлсэн — "хуулж буулгасан" биш
- Socket.IO namespace concept-г өөрөө судалж баталгаажуулсан
- Test-уудыг AI-тай хамт бичсэн ч **яагаад тийм expect хийж байгааг** мэдэж байсан
- Debug хийхдээ AI санал авсан боловч **root cause-г өөрөө тодорхойлсон**
