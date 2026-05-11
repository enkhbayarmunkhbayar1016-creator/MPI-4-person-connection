# STACK-COMPARISON.md — Real-time Communication Stack

## Харьцуулсан 3 Stack

| Шалгуур | Socket.IO | Native WebSocket | Server-Sent Events (SSE) |
|---------|-----------|-----------------|--------------------------|
| **Хоёр талын харилцаа** | ✅ Тийм | ✅ Тийм | ❌ Зөвхөн server→client |
| **Auto reconnect** | ✅ Автомат | ❌ Гар аргаар | ✅ Автомат |
| **Namespace/Room** | ✅ Бэлэн | ❌ Гараар хийх | ❌ Байхгүй |
| **Fallback (HTTP long-poll)** | ✅ Тийм | ❌ Байхгүй | — |
| **Broadcasting** | ✅ Хялбар API | ⚠️ Нарийн | ❌ Дэмждэггүй |
| **Server load** | ⚠️ Дунд | ✅ Бага | ✅ Хамгийн бага |
| **Browser support** | ✅ Бүх browser | ✅ Бүх орчин үеийн | ✅ Бүх орчин үеийн |
| **Learning curve** | ✅ Хялбар | ⚠️ Дунд | ✅ Хялбар |
| **Npm ecosystem** | ✅ Баялаг | — | ⚠️ Хязгаарлагдмал |

## Дүгнэлт

**Socket.IO** — сонгосон шалтгаан:
- Namespace (`/server-a`, `/server-b`, `/admin`) нь энэ проектын үндсэн архитектурын шаардлага
- Auto-reconnect болон fallback нь production найдвартай байдалд чухал
- Broadcasting API нь relay логикийг хялбаршуулдаг

**Native WebSocket** — хэрэв in-house protocol хэрэгтэй байсан бол авч болох байсан, гэхдээ namespace байхгүй учир 3 тусдаа сервер шаардагдах байсан.

**SSE** — зөвхөн сервер→клиент чиглэлд ажилладаг учир chat системд тохиромжгүй.
