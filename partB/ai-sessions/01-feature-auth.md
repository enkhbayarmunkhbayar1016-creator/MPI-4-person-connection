# AI Session 01 — Auth System Feature

**Огноо:** 2026-05-05  
**Зорилго:** Admin нэвтрэх, token-based session, client бүртгэл хэрэгжүүлэх

---

## Хийсэн ажил

### Хэрэглэгчийн хүсэлт
Admin нэвтрэх (`/api/login`), token үүсгэх, `requireAuth` middleware, client бүртгэл (`/api/register`) нэмэх.

### AI-тай харилцалт (товчилсон)

**Би:** Express сервер дээр admin auth хэрхэн хийх вэ? JWT хэрэгтэй юу?

**Claude:** JWT нэмэлт dependency болно, энэ хэмжээний системд `Map`-д хадгалах in-memory token хангалттай. `crypto.randomBytes`-аас ч хялбар `Math.random().toString(36)` ашиглаж болно тест дээр — production бол `crypto` ашигла.

```js
function mkToken() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
```

**Би:** `requireAuth` middleware яаж бичих вэ?

**Claude:** Header-с токен уншиж, sessions Map-д шалгана:

```js
function requireAuth(req, res, next) {
  const tok = req.headers['x-admin-token'];
  if (!tok || !sessions.has(tok)) return res.status(401).json({ error: 'Unauthorized' });
  req.adminUser = sessions.get(tok);
  next();
}
```

### Үр дүн
- `/api/login`, `/api/register`, `/api/logout` endpoint ажиллаж байна
- Token-based session хэрэгжлээ
- Client ID 1-4 эргэн тойрон дараалдаг

### AI-н sanity check
- Токен `Map`-д хадгалагдах нь server restart дээр алдагдана — тэмдэглэсэн
- `Math.random()` нь cryptographically secure биш — production-д `crypto.randomBytes` ашиглахыг зөвлөсөн
