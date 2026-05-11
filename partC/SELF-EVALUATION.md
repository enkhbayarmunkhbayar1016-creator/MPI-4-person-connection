# Self-Evaluation — BIE-DAALT-13

**Огноо:** 2026-05-11

---

## Хэрзэ шалгалт өнөөдөр болбол би энэ кодыг өөрөө бичиж чадах уу?

**Тийм** — Socket.IO namespace, Express middleware, JWT-гүй token session патерн ойлгосон. Хэрэв дахин бичих шаардлага гарвал AI туслалцаагүйгээр боломжтой.

---

## Дахин хийнэ гэвэл юу өөрөөр хийх вэ?

1. **Мессеж persistence** — Redis эсвэл SQLite ашиглах (одоо in-memory)
2. **Input validation** — express-validator нэмэх
3. **Rate limiting** — `/api/login`-д brute force хамгаалалт
4. **Test coverage** — Socket.IO event-уудад integration test нэмэх
5. **Environment variables** — default admin credentials-г env-с авах

---

## Энэ туршлагаас юу сурсан бэ?

- **AI tool нь "хурдны хэрэгсэл"** — бодлогыг өөрөө гаргаж, хэрэгжүүлэлтийг хурдасгадаг
- **Verify, don't trust** зарчим — AI output үргэлж шалгах хэрэгтэй (hallucination жишээ)
- **Socket.IO namespace** нь room-оос илүү isolation өгдөг — энэ pattern шинэ байсан
- **Conventional Commits** нь git history унших болон changelog үүсгэхэд практик ашигтай
- **OpenAPI spec** эхлээд бичих (design-first) нь API тодорхой болгодог
