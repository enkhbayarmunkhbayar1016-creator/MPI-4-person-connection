# AI Session 03 — Dark/Light Mode + GIF/Sticker UI

**Огноо:** 2026-05-09  
**Зорилго:** Dark/Light mode toggle, Tenor GIF, sticker support нэмэх

---

## Хийсэн ажил

### Хэрэглэгчийн хүсэлт
UI-д dark/light mode нэмэх, Tenor GIF болон sticker мессеж дэмжих.

### AI-тай харилцалт (товчилсон)

**Би:** Dark mode-г localStorage-д хадгалах ба CSS flash-аас зайлсхийх яаж хийх вэ?

**Claude:** Theme-г `<head>` дотор script-ийн эхэнд уншиж apply хийнэ — CSS load болохоос өмнө:

```html
<script>
  (function() {
    const t = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.add(t);
  })();
</script>
```

Ингэснээр light mode flash арилна.

**Би:** GIF мессежийг chat bubble-д яаж харуулах вэ?

**Claude:** Message type-г шалган `<img>` tag render хийнэ:

```js
if (msg.type === 'gif') {
  el.innerHTML = `<img src="${msg.text}" style="max-width:200px;border-radius:8px;">`;
}
```

XSS-с хамгаалахын тулд `msg.text` нь URL format шалгасан байх ёстой.

### Үр дүн
- Dark/light toggle ажиллаж байна, localStorage-д persist хийнэ
- Light mode flash засагдлаа
- 12 Tenor GIF жагсаалтаас санамсаргүй GIF илгээх боломжтой
- Sticker (cat мур2.jpg) илгээх боломжтой

### Security анхааруулга
Claude GIF URL-г `<img src>` дотор direct оруулах нь XSS эрсдэлтэй гэж онцолсон. 
Tenor GIF-ийн URL-г hardcode жагсаалтаас авдаг тул user input биш — эрсдэл бага.
