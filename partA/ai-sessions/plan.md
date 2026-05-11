# AI Planning Session — БИЕ ДААЛТ 13

**Огноо:** 2026-05-11  
**Хэрэгсэл:** Claude Code (claude-sonnet-4-6)

## Хэлэлцүүлгийн товч

### Асуулт 1: Stack сонголт
**Хэрэглэгч:** Socket.IO vs native WebSocket vs SSE — аль нь тохиромжтой вэ?

**AI хариу:** Socket.IO-г санал болголоо. Шалтгаан: namespace дэмжлэг нь `/server-a`, `/server-b`, `/admin` гэсэн шаардлагыг шууд хангадаг. Native WebSocket-ээр хийхэд namespace-г гараар хэрэгжүүлэх шаардлагатай болно. SSE нь bidirectional биш учир chat-д тохиромжгүй.

### Асуулт 2: Архитектур
**Хэрэглэгч:** Admin panel яаж холбох вэ?

**AI хариу:** `/admin` namespace ашиглан real-time stats push хийх. Admin нь `stats` event-ийг subscribe хийж, сервер state өөрчлөгдөх бүрт автоматаар шинэчлэгдэнэ. `toggle-server`, `kick-client` event-үүдийг admin-аас сервер рүү илгээнэ.

### Асуулт 3: Message relay
**Хэрэглэгч:** Server A-аас Server B руу мессеж яаж дамжуулах вэ?

**AI хариу:** `setTimeout(250)` ашиглан relay хийх. Энэ нь distributed system-д network latency дуурайлгах зорилготой. Production-д Redis pub/sub ашиглах нь илүү тохиромжтой байна (ADR-002-д тусгасан).

### Асуулт 4: Folder бүтэц
**Хэрэглэгч:** БИЕ ДААЛТ 13-ийн шаардлагад нийцүүлэн яаж зохион байгуулах вэ?

**AI хариу:** `partA/`, `partB/`, `partC/` folder-уудад хуваах. Одоогийн код `partB/src/`-д, тест `partB/tests/`-д байрлуулна. Slash command-уудыг `.claude/commands/`-д нэмнэ.

## Гол шийдвэрүүд
1. Socket.IO namespace → distributed server дуурайлга
2. In-memory state → хурдан прототип, scale шаардлагагүй
3. Vanilla JS frontend → framework суралцах хугацаа хэмнэх
4. Single process → deployment хялбар (Render.com free tier)
