# ADR-001: Socket.IO-г Real-time Communication Stack болгон сонгох

**Огноо:** 2026-05-11  
**Статус:** Accepted

## Нөхцөл байдал

4 хэрэглэгч 2 тусдаа "сервер" дээр нэгэн зэрэг холбогдож, хоорондоо мессеж солилцох шаардлагатай. Үүнд:
- Хоёр талын (bidirectional) харилцаа шаардлагатай
- Олон "сервер" (namespace) дахь хэрэглэгчид нэг дор мессеж хүлээн авах ёстой
- Admin нь бодит цагт холбогдсон хэрэглэгчдийг харах, удирдах боломжтой байх ёстой

## Шийдвэр

**Socket.IO 4** ашиглах.

## Шалтгаан

1. **Namespace дэмжлэг** — `/server-a`, `/server-b`, `/admin` гэсэн тусдаа namespace нь архитектурын гол шаардлагыг шууд хангадаг; native WebSocket-ээр хийхэд 3 тусдаа сервер шаардагдана.
2. **Auto-reconnect** — Render.com дээр deploy хийхэд сервер restart болдог тул автомат reconnect чухал.
3. **Polling fallback** — corporate firewall-д WebSocket блоклогдсон үед HTTP long-polling руу автоматаар шилждэг.
4. **Broadcasting API** — `ns.emit()` нэг мөрөөр бүх холбогдсон хэрэглэгчид мессеж илгээдэг, relay логик хялбар болдог.

## Үр дагавар

- `socket.io` npm package нэмэгдсэн (нэмэлт bundle size)
- Server-side state (clients Map) in-memory хадгалагддаг — scale-out хийхэд Redis adapter шаардагдана
- SSE эсвэл native WebSocket-ийн хувилбараас татгалзлаа
