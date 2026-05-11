# AI Session 02 — Message Relay Feature

**Огноо:** 2026-05-07  
**Зорилго:** Server A ↔ Server B мессеж relay, 250ms delay, Socket.IO namespace

---

## Хийсэн ажил

### Хэрэглэгчийн хүсэлт
Server A-д ирсэн мессеж 250ms хоцролттойгоор Server B рүү relay хийх.

### AI-тай харилцалт (товчилсон)

**Би:** Хоёр Socket.IO namespace хооронд мессеж relay хэрхэн хийх вэ?

**Claude:** Namespace-г хувьсагчаар авч, emit хийхдээ setTimeout ашиглана:

```js
socket.on('message', data => {
  ns.emit('message', msg);
  setTimeout(() => otherNs.emit('message', msg), RELAY_MS);
});
```

`attachServer(nsA, 'A', nsB)` — функц дотор `otherNs` параметраар дамжуулах нь clean.

**Би:** Server offline болоход холбогдсон clientуудыг яаж шилжүүлэх вэ?

**Claude:** `server-down` event илгээж, client-side тал дээр `redirect` field-г унших:

```js
if (!state[srv].online) {
  socket.emit('server-down', { redirect: srv === 'A' ? 'B' : 'A' });
  socket.disconnect();
  return;
}
```

### Үр дүн
- `/server-a`, `/server-b` namespace ажиллаж байна
- 250ms relay delay хэрэгжлээ
- Server toggle хийхэд clientууд нөгөө серверт шилжинэ
- Admin `kick-client` ажиллаж байна

### Hallucination шалгалт
Claude `socket.to(room).emit()` ашиглахыг санал болгосон — гэхдээ namespace-д room ашиглахгүй, `ns.emit()` зөв. Шалгаж засав.
