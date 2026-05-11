# ADR-002 — WebSocket Relay Architecture Decision

**Огноо:** 2026-05-08  
**Статус:** Accepted  
**Шийдвэр гаргасан:** Build үе шатанд relay pattern сонгох

---

## Контекст

Server A болон Server B хооронд мессеж relay хийх хэрэгтэй болсон. Хэд хэдэн арга байсан:

1. **Redis Pub/Sub** — мессежийг Redis-ээр relay
2. **Direct namespace emit** — нэг сервер дотор хоёр namespace
3. **Separate server process** — тус тусдаа Node процесс, HTTP relay

---

## Шийдвэр

**Direct namespace emit with setTimeout delay** сонгосон.

```js
socket.on('message', data => {
  ns.emit('message', msg);
  setTimeout(() => otherNs.emit('message', msg), 250);
});
```

---

## Шалтгаан

| Шалгуур | Redis Pub/Sub | Direct emit | Separate process |
|---------|--------------|-------------|-----------------|
| Хялбар байдал | ❌ нэмэлт service | ✅ нэг процесс | ❌ IPC шаардлагатай |
| Scalability | ✅ өндөр | ⚠️ дунд | ✅ өндөр |
| Delay control | ⚠️ тохируулахад хэцүү | ✅ setTimeout | ❌ хэцүү |
| Deploy | ❌ Redis instance хэрэгтэй | ✅ нэг Render deploy | ❌ хоёр deploy |

**Энэ хэмжээний системд** (4 хүн, demo зориулалт) direct emit нь хамгийн практик.

---

## Үр дагавар

- ✅ 250ms relay delay тохируулж болдог (`RELAY_MS` константаар)
- ✅ Server toggle хийхэд relay зогсдог (state.online шалгалт)
- ⚠️ Vertical scaling хязгаарлагдмал — олон тооны concurrent user-д Redis шаардлагатай болно
- ⚠️ Server restart дээр мессеж алддаг (in-memory messages array)

---

## AI-тай ярилцалт

Claude Redis Pub/Sub-г анх санал болгосон. Гэхдээ нэмэлт Redis instance deploy хийх шаардлага, Render.com-ын free tier хязгаарыг харгалзан direct approach сонгосон. AI энэ шийдвэрийг дэмжсэн.
