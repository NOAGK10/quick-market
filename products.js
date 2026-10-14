/* =========================================================
   קובץ הנתונים של האתר
   ---------------------------------------------------------
   את הקובץ הזה הכי נוח לעדכן דרך admin.html
   (מוסיפים מוצרים שם ולוחצים "הורדת products.js"),
   אבל אפשר גם לערוך אותו ידנית.

   שדות של מוצר:
     title     – שם המוצר
     category  – מזהה הקטגוריה (id מהרשימה למטה)
     price     – מחיר נוכחי, למשל "₪39"
     oldPrice  – מחיר לפני הנחה (לא חובה) – יוצג אחוז ההנחה
     badge     – תגית (לא חובה): "להיט" / "חדש" / "מבצע"
     link      – קישור השותפים לאלי אקספרס
     image     – קישור לתמונה
   ========================================================= */

const SITE = {
  "name": "Quick Market",
  "tagline": "המוצרים הכי שווים מאלי אקספרס – נבחרו אחד־אחד, במחירים שאי אפשר לפספס",
  "email": "b7000289@gmail.com"
};

const CATEGORIES = [
  { "id": "women", "name": "נשים", "icon": "👗" },
  { "id": "men", "name": "גברים", "icon": "👔" },
  { "id": "kids", "name": "ילדים", "icon": "🧸" },
  { "id": "home", "name": "בית ומטבח", "icon": "🏠" },
  { "id": "gadgets", "name": "גאדג'טים", "icon": "🎧" },
  { "id": "sport", "name": "ספורט", "icon": "⚽" }
];

const PRODUCTS = [
  {
    "id": "p1",
    "title": "תיק צד מינימליסטי מעור טבעוני",
    "category": "women",
    "price": "₪39",
    "oldPrice": "₪69",
    "badge": "להיט",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/bag/800/800"
  },
  {
    "id": "p2",
    "title": "שעון יד קלאסי עם רצועת רשת",
    "category": "men",
    "price": "₪55",
    "oldPrice": "",
    "badge": "חדש",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/watch/800/800"
  },
  {
    "id": "p3",
    "title": "אוזניות אלחוטיות עם ביטול רעשים",
    "category": "gadgets",
    "price": "₪89",
    "oldPrice": "₪149",
    "badge": "מבצע",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/buds/800/800"
  },
  {
    "id": "p4",
    "title": "סט קופסאות אחסון למטבח",
    "category": "home",
    "price": "₪45",
    "oldPrice": "",
    "badge": "",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/kitchen/800/800"
  },
  {
    "id": "p5",
    "title": "בקבוק ספורט תרמי 750 מ\"ל",
    "category": "sport",
    "price": "₪29",
    "oldPrice": "₪42",
    "badge": "",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/bottle/800/800"
  },
  {
    "id": "p6",
    "title": "משחק הרכבה יצירתי לילדים",
    "category": "kids",
    "price": "₪35",
    "oldPrice": "",
    "badge": "להיט",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/toys/800/800"
  },
  {
    "id": "p7",
    "title": "משקפי שמש בעיצוב רטרו",
    "category": "women",
    "price": "₪22",
    "oldPrice": "₪35",
    "badge": "",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/sunglass/800/800"
  },
  {
    "id": "p8",
    "title": "מנורת לילה חכמה עם חיישן תנועה",
    "category": "gadgets",
    "price": "₪31",
    "oldPrice": "",
    "badge": "חדש",
    "link": "https://www.aliexpress.com/",
    "image": "https://picsum.photos/seed/lamp/800/800"
  }
];
