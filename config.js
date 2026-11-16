// ===== كل ما يخص المطعم موجود هنا فقط =====
const restaurantConfig = {
  name: "abobaker",
  tagline: "Taste of Africa",
  description: "Authentic African cuisine made with love.",
  story: "At abobaker, we celebrate the rich flavors of African cuisine. Every dish is prepared with care, inspired by tradition, and served with the warmth of home.",
  address: "Kigali, Rwanda",
  currency: "RWF",
  whatsapp: "249925607582", // أرقام فقط مع كود الدولة، بدون + أو مسافات

  // ----- Branding (كل الحقول اختيارية) -----
  logo: "images/logo.png",                         // مثال: "images/logo.png" — اتركه فارغاً لعرض الاسم فقط
  favicon: "images/favicon.svg",
  colors: { primary: "#173d32", accent: "#d6ad60", background: "#f7f3eb" },

  // ----- Contact & social (احذف أي سطر غير متوفر وسيختفي من الموقع) -----
  contact: {
    phone: "+250795442629",
    email: "info@abobaker.com",
    instagram: "https://instagram.com/abobaker",
    facebook: "https://facebook.com/abobaker",
    tiktok: "",
    youtube: ""
  },

  // ----- Business hours (قيم تجريبية) -----
  // كل يوم = قائمة فترات [فتح, إغلاق] بصيغة 24 ساعة. قائمة فارغة [] = مغلق.
  // فترتان في اليوم = دوام مقسّم (غداء + عشاء). الفترة لازم تنتهي في نفس اليوم.
  hours: {
    monday:    [],
    tuesday:   [["11:00", "22:00"]],
    wednesday: [["11:00", "22:00"]],
    thursday:  [["11:00", "22:00"]],
    friday:    [["11:00", "15:00"], ["18:00", "23:00"]],
    saturday:  [["11:00", "23:00"]],
    sunday:    [["12:00", "21:00"]]
  },

  // ----- Booking rules (كلها اختيارية، وهذه القيم الافتراضية) -----
  booking: {
    minGuests: 1,
    maxGuests: 10,
    slotMinutes: 30,                 // الفاصل بين أوقات الحجز
    minAdvanceMinutes: 60,           // أقل مدة قبل الموعد (لحجز اليوم نفسه)
    maxAdvanceDays: 60,              // أبعد يوم يمكن الحجز فيه
    lastSeatingBeforeCloseMinutes: 60 // آخر حجز قبل الإغلاق بكم دقيقة
  },

  menu: [
    {
      name: "Grilled Chicken Plate",
      description: "Herb-marinated chicken with seasonal sides.",
      price: 8000,
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=700",
      alt: "Grilled chicken meal"
    },
    {
      name: "Golden Rice Bowl",
      description: "Fragrant rice served with fresh vegetables.",
      price: 6500,
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=700",
      alt: "Rice and vegetables"
    },
    {
      name: "Traditional Feast",
      description: "A comforting combination of local favorites.",
      price: 9500,
      image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=700",
      alt: "Traditional African meal"
    },
    {
  name: "African Beef Platter",
  description: "Tender grilled beef served with traditional sides.",
  price: 12000,
  image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=700",
  alt: "Grilled beef platter"
}
 
]

};