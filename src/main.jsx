import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import {
  ArrowLeft,
  Banknote,
  History,
  Landmark,
  Minus,
  Paperclip,
  Plus,
  ShoppingCart,
  Smartphone,
} from "lucide-react";

import * as XLSX from "xlsx";

const MENU = {
  "Matcha Lattes": [
  {
    id: "ml1",
    name: "Rock Star Mei Mei",
    basePrice: 280,
    desc: (
      <>
        Star Sea Salt Cloud, Ukiyo Matcha,<br />
        Oat Milk
      </>
    ),
  },
  {
    id: "ml2",
    name: "Rock Star Jasmine",
    basePrice: 280,
    desc: (
      <>
        Star Sea Salt Cloud, Hatsume Matcha,<br />
        Jasmine Tea, Oat Milk
      </>
    ),
  },
  {
    id: "ml3",
    name: "Mei Mei's Matcha",
    basePrice: 250,
    desc: (
      <>
        Ukiyo Matcha,<br />
        Oat Milk
      </>
    ),
  },
  {
    id: "ml4",
    name: "Jasmine Matcha",
    basePrice: 250,
    desc: (
      <>
        Hatsume Matcha, Jasmine Tea,<br />
        Oat Milk
      </>
    ),
  },
  {
    id: "ml5",
    name: "Rockstar-Berry",
    basePrice: 290,
    desc: (
      <>
        Star Acai Berry Powder, Strawberry Cloud,<br />
        Ukiyo Matcha, Oat Milk
      </>
    ),
  },
  {
    id: "ml6",
    name: "Honey Whipped Matcha",
    basePrice: 290,
    desc: (
      <>
        Honey Whipped Foam, Ukiyo Matcha,<br />
        Oat Milk
      </>
    ),
  },
],

  Teas: [
    {
      id: "nm1",
      name: "Oolong Rocks",
      basePrice: 200,
      desc: "Star Sea Salt Cloud, Oolong Tea",
    },
    {
      id: "nm2",
      name: "Jasmine Rocks",
      basePrice: 200,
      desc: "Star Sea Salt Cloud, Jasmine Tea",
    },
    {
      id: "nm3",
      name: "Jasmine Milk Tea",
      basePrice: 170,
      desc: "Jasmine Tea, Oat Milk",
    },
    {
      id: "nm4",
      name: "Hojicha Oolong Milk Tea",
      basePrice: 180,
      desc: "Hojicha, Jasmine Tea, Oat Milk",
    },
    {
      id: "nm5",
      name: "New York Fog",
      basePrice: 222,
      desc: "Sea Salt Cloud, Earl Grey, Oolong Tea",
    },
  ],

  "Hojicha Lattes": [
    {
      id: "hl1",
      name: "Rockstar Hojicha",
      basePrice: 270,
      desc: "Star Sea Salt Cloud, Hojicha, Oat Milk",
    },
    {
      id: "hl2",
      name: "Hojicha Latte",
      basePrice: 240,
      desc: "Hojicha, Oat Milk",
    },
    {
      id: "hl3",
      name: "Hojicha Oolong Milk Tea",
      basePrice: 180,
      desc: "Hojicha, Jasmine Tea, Oat Milk",
    },
  ],
};

const MATCHA_OPTIONS = [
  { id: "standard", label: "Standard", price: 0 },
  { id: "koume", label: "Koume", price: 30 },
];

const DRINK_MATCHA_BASE = {
  "Rock Star Mei Mei": "Ukiyo",
  "Rock Star Jasmine": "Hatsume",
  "Mei Mei's Matcha": "Ukiyo",
  "Jasmine Matcha": "Hatsume",
  "Rockstar-Berry": "Ukiyo",
  "Honey Whipped Matcha": "Ukiyo"
};

const MATCHA_LEVEL = [
  {
    id: "lvl1",
    label: "Level 1",
    price: 0,
  },
  {
    id: "lvl2",
    label: "Level 2",
    price: 30,
  },
  {
    id: "lvl3",
    label: "Level 3",
    price: 60,
  },
];

const SUGAR_LEVELS = [
  {
    id: "unsweetened",
    label: "★",
  },
  {
    id: "less_sweet",
    label: "A lil",
  },
  {
    id: "sweet",
    label: "Sweeet",
  },
];

const ICE_LEVELS = [
  {
    id: "less_ice",
    label: "Less Ice",
  },
  {
    id: "regular_ice",
    label: "Regular Ice",
  },
  {
    id: "more_ice",
    label: "Icy",
  },
];

const DISCOUNT_CODES = {
  "5OFF": {
    type: "percent",
    value: 5,
    scope: "item",
    desc: "5% off discount for one drink",
  },

  CLOUTCHASER: {
    type: "percent",
    value: 100,
    scope: "item",
    desc: "100% discount for KOL 1 free drink",
  },

  "15OFF": {
    type: "percent",
    value: 15,
    scope: "item",
    desc: "15% off discount on one drink",
  },
};

const CATEGORY_ICONS = {
  "Matcha Lattes": "🍵",
  Teas: "🧋",
  "Hojicha Lattes": "🤎",
};

const CATEGORY_COLORS = {
  "Matcha Lattes": {
    accent: "#2d6a4f",
    badge: "#b7e4c7",
  },
  Teas: {
    accent: "#c2410c",
    badge: "#fed7aa",
  },
  "Hojicha Lattes": {
    accent: "#581c87", // Dark purple
    badge: "#e9d5ff",
  },
};

const STORAGE_KEY = "matcha_pos_orders";
const ORDER_NUMBER_KEY = "matcha_pos_next_order_number";

const FRESH_CUSTOMIZE = {
  powder: "standard",
  level: "lvl1",
  sugar: "unsweetened",
  ice: "regular_ice",
  milk: "oat",
  discountCode: "",
  appliedDiscount: null,
  discountError: "",
  qty: 1,
};

function loadOrders() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(parsed)
      ? parsed.map((order) => ({
          ...order,

          items: Array.isArray(order?.items)
            ? order.items
            : [],

          // Existing orders without a status
          // are considered pending.
          status:
            order?.status || "pending",

          customerName:
            order?.customerName || "",
        }))
      : [];
  } catch {
    return [];
  }
}

const PAYMENT_DB_NAME = "matcha_pos_payment_images";
const PAYMENT_DB_VERSION = 1;
const PAYMENT_STORE_NAME = "images";

function openPaymentDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported by this browser."));
      return;
    }

    const request = indexedDB.open(
      PAYMENT_DB_NAME,
      PAYMENT_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PAYMENT_STORE_NAME)) {
        db.createObjectStore(PAYMENT_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ||
          new Error("Unable to open payment image storage.")
      );
  });
}

async function savePaymentImage(key, image) {
  const db = await openPaymentDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      PAYMENT_STORE_NAME,
      "readwrite"
    );

    transaction.objectStore(PAYMENT_STORE_NAME).put(
      image,
      key
    );

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Unable to save payment screenshot.")
      );
    };
  });
}

async function getPaymentImage(key) {
  if (!key) return null;

  try {
    const db = await openPaymentDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        PAYMENT_STORE_NAME,
        "readonly"
      );

      const request = transaction
        .objectStore(PAYMENT_STORE_NAME)
        .get(key);

      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };

      request.onerror = () => {
        db.close();
        reject(
          request.error ||
            new Error("Unable to load payment screenshot.")
        );
      };
    });
  } catch (error) {
    console.error("Unable to load payment screenshot:", error);
    return null;
  }
}

/*
 * Older versions stored payment screenshots directly inside
 * localStorage as base64 strings. That quickly exceeds the browser's
 * localStorage quota. This migration moves those screenshots into
 * IndexedDB and leaves only a small reference in the order record.
 */
async function migratePaymentImages() {
  const orders = loadOrders();

  const ordersWithImages = orders.filter(
    (order) =>
      order?.paymentImage &&
      !order?.paymentImageKey
  );

  if (ordersWithImages.length === 0) {
    return orders;
  }

  const migratedOrders = orders.map(
    (order) => ({
      ...order,
    })
  );

  for (const order of migratedOrders) {
    if (
      !order?.paymentImage ||
      order.paymentImageKey
    ) {
      continue;
    }

    const key = `payment-${order.orderNum}`;

    try {
      await savePaymentImage(
        key,
        order.paymentImage
      );

      delete order.paymentImage;
      order.paymentImageKey = key;
    } catch (error) {
      console.error(
        `Could not migrate payment screenshot for ${order.orderNum}:`,
        error
      );
    }
  }

  /*
   * Saving the migrated orders should be dramatically smaller because
   * the base64 images have been removed.
   */
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(migratedOrders)
    );
  } catch (error) {
    console.error(
      "Unable to save migrated orders:",
      error
    );

    /*
     * If localStorage is already unusually full, preserve the order
     * records without the image payloads rather than crashing checkout.
     */
    const lightweightOrders =
      migratedOrders.map(
        (order) => {
          const copy = {
            ...order,
          };
          delete copy.paymentImage;
          return copy;
        }
      );

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lightweightOrders)
      );
    } catch (secondError) {
      console.error(
        "Unable to save lightweight order history:",
        secondError
      );
    }
  }

  return migratedOrders;
}

async function saveOrder(order) {
  /*
   * Make sure any screenshots from the previous localStorage-based
   * implementation are moved out before saving the new order.
   */
  await migratePaymentImages();

  const storageOrder = {
    ...order,
  };

  if (order.paymentImage) {
    const key =
      order.paymentImageKey ||
      `payment-${order.orderNum}`;

    await savePaymentImage(
      key,
      order.paymentImage
    );

    storageOrder.paymentImageKey = key;

    /*
     * Never put the base64 image into localStorage.
     */
    delete storageOrder.paymentImage;
  }

  const orders = loadOrders();
  orders.push(storageOrder);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(orders)
    );
  } catch (error) {
    /*
     * This is a safety net for other localStorage data. The payment
     * screenshot itself is already safely stored in IndexedDB.
     */
    console.error(
      "localStorage quota exceeded while saving order:",
      error
    );

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          orders.map((savedOrder) => {
            const lightweightOrder = {
              ...savedOrder,
            };
            delete lightweightOrder.paymentImage;
            return lightweightOrder;
          })
        )
      );
    } catch (secondError) {
      console.error(
        "Unable to save order history:",
        secondError
      );
      throw secondError;
    }
  }

  /*
   * Return the original order for the receipt. This keeps the image
   * available in React memory while avoiding localStorage bloat.
   */
  return {
    ...order,
    paymentImageKey:
      storageOrder.paymentImageKey ||
      order.paymentImageKey ||
      null,
  };
}

function getNextOrderNumber() {
  const current = Number(
    localStorage.getItem(ORDER_NUMBER_KEY) || "1"
  );

  localStorage.setItem(
    ORDER_NUMBER_KEY,
    String(current + 1)
  );

  return `ORD-${String(current).padStart(6, "0")}`;
}

function formatPHP(n) {
  return (
    "₱" +
    Number(n || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export default function App() {
  const [view, setView] = useState("Matcha Lattes");
  const [activeCategory, setActiveCategory] =
    useState("Matcha Lattes");

  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] =
    useState(loadOrders);

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] =
    useState(null);
  const [discountError, setDiscountError] = useState("");

  const [customerName, setCustomerName] = useState("");

  const [orderNote, setOrderNote] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [paymentImage, setPaymentImage] =
    useState(null);

  const [historyImage, setHistoryImage] =
    useState(null);

  const [completedOrder, setCompletedOrder] =
    useState(null);

  const [historyFilter, setHistoryFilter] =
    useState("today");

  const [customize, setCustomize] =
    useState(FRESH_CUSTOMIZE);

  useEffect(() => {
    let mounted = true;

    migratePaymentImages()
      .then((migratedOrders) => {
        if (mounted) {
          setOrderHistory(migratedOrders);
        }
      })
      .catch((error) => {
        console.error(
          "Payment screenshot migration failed:",
          error
        );
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.finalPrice * item.qty,
    0
  );

  const getDiscount = (code, total) => {
    const discount =
      DISCOUNT_CODES[code?.toUpperCase()];

    if (!discount) return 0;

    return discount.type === "percent"
      ? (total * discount.value) / 100
      : discount.value;
  };

  const billTotal = (() => {
    if (!appliedDiscount) {
      return cartTotal;
    }

    const discount =
      DISCOUNT_CODES[appliedDiscount];

    if (!discount) {
      return cartTotal;
    }

    // ==========================================
    // ITEM-ONLY DISCOUNT
    // Apply to ONE drink only
    // ==========================================
    if (discount.scope === "item") {
      if (cart.length === 0) {
        return cartTotal;
      }

      // Find the first drink with at least 1 quantity
      const firstItem = cart.find(
        (item) => item.qty > 0
      );

      if (!firstItem) {
        return cartTotal;
      }

      // Discount ONLY ONE unit of the drink.
      const singleDrinkPrice = Number(
        firstItem.finalPrice || 0
      );

      const discountAmount =
        discount.type === "percent"
          ? (singleDrinkPrice * discount.value) / 100
          : discount.value;

      return Math.max(
        0,
        cartTotal - discountAmount
      );
    }

    // ==========================================
    // ORDER-WIDE DISCOUNT
    // ==========================================
    const discountAmount =
      discount.type === "percent"
        ? (cartTotal * discount.value) / 100
        : discount.value;

    return Math.max(
      0,
      cartTotal - discountAmount
    );
  })();

  /*
   * Calculates the price BEFORE item-level discount.
   */
  const computeBaseItemPrice = (item, c) => {
    const powderDelta =
      isMatchaLatte
        ? MATCHA_OPTIONS.find(
            (m) => m.id === c.powder
          )?.price || 0
        : 0;

    const levelDelta =
      isMatchaLatte
        ? MATCHA_LEVEL.find(
            (m) => m.id === c.level
          )?.price || 0
        : 0;

    return (
      item.basePrice +
      powderDelta +
      levelDelta
    );
  };

  /*
   * Calculates final item price AFTER item-level discount.
   */
  const computeItemPrice = (item, c) => {
    const base =
      computeBaseItemPrice(item, c);

    const itemDiscount = c.appliedDiscount
      ? getDiscount(
          c.appliedDiscount,
          base
        )
      : 0;

    return Math.max(
      0,
      base - itemDiscount
    );
  };

  const isMatchaLatte = activeCategory === "Matcha Lattes";

  const availableMatchaOptions = (item) => {
    const standardBase = DRINK_MATCHA_BASE[item?.name];
    if (!standardBase) return [];
    return [
      { id: "standard", label: `Standard (${standardBase})`, price: 0 },
      { id: "koume", label: "Koume", price: 30 },
    ];
  };

  const openCustomize = (item) => {
    setSelectedItem(item);
    setCustomize({
      ...FRESH_CUSTOMIZE,
      powder: "standard",
      level: activeCategory === "Matcha Lattes" ? "lvl1" : null
    });
    setView("customize");
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const finalPrice = computeItemPrice(
      selectedItem,
      customize
    );

    setCart((currentCart) => [
      ...currentCart,
      {
        id:
          Date.now() +
          Math.random(),

        itemId: selectedItem.id,
        name: selectedItem.name,
        category: activeCategory,

        basePrice:
          selectedItem.basePrice,

        finalPrice,

        qty: customize.qty,

        powder: customize.powder,
        level: customize.level,
        sugar: customize.sugar,
        ice: customize.ice,
        milk: customize.milk,

        itemDiscount:
          customize.appliedDiscount,
      },
    ]);

    setView("cart");
  };

  const removeFromCart = (id) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== id
      )
    );
  };

  const applyOrderDiscount = () => {
    const code = discountCode.trim().toUpperCase();
    const discount = DISCOUNT_CODES[code];

    if (!discount) {
      setDiscountError("Invalid discount code");
      setAppliedDiscount(null);
      return;
    }

    // Item-scope codes are allowed here.
    // They will automatically apply to only ONE drink
    // when billTotal is calculated.

    setAppliedDiscount(code);
    setDiscountError("");
  };

  const applyItemDiscount = () => {
    const code =
      customize.discountCode
        .trim()
        .toUpperCase();

    const discount = DISCOUNT_CODES[code];

    if (!discount) {
      setCustomize((current) => ({
        ...current,
        discountError: "Invalid code",
        appliedDiscount: null,
      }));

      return;
    }

    // Item discounts are valid here.
    // Order-only codes can be blocked if you add any later.
    if (discount.scope === "order") {
      setCustomize((current) => ({
        ...current,
        discountError:
          "This discount code can only be applied to the entire order.",
        appliedDiscount: null,
      }));

      return;
    }

    setCustomize((current) => ({
      ...current,
      appliedDiscount: code,
      discountError: "",
    }));
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    const orderNum =
      getNextOrderNumber();

    const order = {
      orderNum,
      date: new Date().toISOString(),

      customerName: customerName.trim(),

      items: cart,

      subtotal: cartTotal,

      orderDiscount: appliedDiscount,

      discountAmount:
        cartTotal - billTotal,

      total: billTotal,

      note: orderNote,

      paymentMethod,

      paymentImage,

      cancelled: false,

      // New orders start as pending.
      status: "pending",
    };

    try {
      const savedOrder = await saveOrder(order);

      setOrderHistory(loadOrders());

      setCompletedOrder(savedOrder);
    } catch (error) {
      console.error("Checkout failed:", error);
      window.alert(
        "The order could not be saved. Please try again. Your payment screenshot was not lost."
      );
      return;
    }

    setCart([]);

    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");

    setCustomerName("");

    setOrderNote("");

    setPaymentImage(null);

    setPaymentMethod("Cash");

    setView("checkout");
  };

  const cancelOrder = (orderNum) => {
    const updated =
      loadOrders().map((order) =>
        order.orderNum === orderNum
          ? {
              ...order,
              cancelled: true,
              cancelledAt:
                new Date().toISOString(),
            }
          : order
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setOrderHistory(updated);
  };

  const completeOrder = (orderNum) => {
    const updated = loadOrders().map(
      (order) =>
        order.orderNum === orderNum
          ? {
              ...order,
              status: "served",
              servedAt:
                new Date().toISOString(),
            }
          : order
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setOrderHistory(updated);
  };

  const exportToExcel = () => {
    const orders = loadOrders();

    const rows = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push({
          "Order #": order.orderNum,

          Date: new Date(
            order.date
          ).toLocaleString("en-PH"),

          "Customer Name":
            order.customerName || "",
          
          Status: order.cancelled
            ? "CANCELLED"
            : order.status === "served"
            ? "SERVED"
            : "PENDING",

          Category:
            item.category,

          Item: item.name,

          "Matcha Powder":
            item.powder === "koume"
              ? "Koume"
              : DRINK_MATCHA_BASE[item.name] || "",

          "Matcha Level":
            MATCHA_LEVEL.find(
              (m) =>
                m.id === item.level
            )?.label ||
            item.level ||
            "",

          "Sugar Level":
            item.sugar || "",

          "Ice Level":
            item.ice || "",

          Qty: item.qty,

          "Unit Price (₱)":
            Number(
              item.finalPrice
            ).toFixed(2),

          "Line Total (₱)":
            (
              item.finalPrice *
              item.qty
            ).toFixed(2),

          "Item Discount Code":
            item.itemDiscount || "",

          "Payment Method":
            order.paymentMethod || "",
        });
      });

      rows.push({
        "Order #": order.orderNum,

        Date: "",

        Status: order.cancelled
          ? "CANCELLED"
          : "Completed",

        Category: "",

        Item: "ORDER TOTAL",

        "Matcha Powder": "",

        "Matcha Level": "",

        "Sugar Level": "",

        "Ice Level": "",

        "Milk Type": "",

        Qty: "",

        "Unit Price (₱)": "",

        "Line Total (₱)":
          Number(
            order.total
          ).toFixed(2),

        "Item Discount Code":
          order.orderDiscount || "",

        "Payment Method":
          order.paymentMethod || "",
      });
    });

    const ws =
      XLSX.utils.json_to_sheet(rows);

    ws["!cols"] = [
      14,
      20,
      12,
      18,
      24,
      18,
      14,
      14,
      14,
      18,
      8,
      16,
      16,
      20,
      18,
    ].map((width) => ({
      wch: width,
    }));

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Orders"
    );

    const completed =
      orders.filter(
        (order) =>
          !order.cancelled
      );

    const summary = [
      {
        Metric:
          "Total Orders (Completed)",
        Value:
          completed.length,
      },

      {
        Metric:
          "Total Revenue (₱)",
        Value:
          completed
            .reduce(
              (sum, order) =>
                sum +
                Number(
                  order.total || 0
                ),
              0
            )
            .toFixed(2),
      },

      {
        Metric:
          "Total Discounts Given (₱)",
        Value:
          completed
            .reduce(
              (sum, order) =>
                sum +
                Number(
                  order.discountAmount ||
                    0
                ),
              0
            )
            .toFixed(2),
      },

      {
        Metric:
          "Total Items Sold",

        Value:
          completed.reduce(
            (sum, order) =>
              sum +
              order.items.reduce(
                (itemSum, item) =>
                  itemSum +
                  Number(
                    item.qty || 0
                  ),
                0
              ),
            0
          ),
      },

      {
        Metric:
          "Cancelled Orders",

        Value:
          orders.filter(
            (order) =>
              order.cancelled
          ).length,
      },
    ];

    const ws2 =
      XLSX.utils.json_to_sheet(
        summary
      );

    ws2["!cols"] = [
      {
        wch: 28,
      },
      {
        wch: 20,
      },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      ws2,
      "Summary"
    );

    XLSX.writeFile(
      wb,
      `matcha_orders_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  const todayStr =
    new Date().toDateString();

  const filteredHistory =
    orderHistory.filter((order) =>
      historyFilter === "today"
        ? new Date(
            order.date
          ).toDateString() ===
          todayStr
        : true
    );

  const activeOrders =
    filteredHistory.filter(
      (order) =>
        !order.cancelled &&
        order.status === "served"
    );

  const todayRevenue =
    activeOrders.reduce(
      (sum, order) =>
        sum +
        Number(order.total || 0),
      0
    );

  /*
   * CUSTOMIZE VIEW
   */

  if (
    view === "customize" &&
    selectedItem
  ) {
    const col =
      CATEGORY_COLORS[
        activeCategory
      ] ||
      CATEGORY_COLORS[
        "Matcha Lattes"
      ];

    const baseItemPrice =
      computeBaseItemPrice(
        selectedItem,
        customize
      );

    const previewPrice =
      computeItemPrice(
        selectedItem,
        customize
      );

    const previewDiscount =
      customize.appliedDiscount
        ? getDiscount(
            customize.appliedDiscount,
            baseItemPrice
          )
        : 0;

    return (
      <div
        style={{
          fontFamily:
            "'Georgia', serif",
          background:
            "#faf8f5",
          minHeight:
            "100vh",
          display:
            "flex",
          flexDirection:
            "column",
        }}
      >
        <header
          style={{
            background:
              col.accent,
            padding:
              "14px 28px",
            display:
              "flex",
            alignItems:
              "center",
            gap: 16,
          }}
        >
          <button
            onClick={() =>
              setView("menu")
            }
            style={{
              background:
                "rgba(255,255,255,0.2)",
              border:
                "none",
              color: "#fff",
              borderRadius: 8,
              padding:
                "6px 14px",
              cursor:
                "pointer",
              fontSize: 14,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <ArrowLeft
              size={16}
              strokeWidth={
                2.25
              }
            />

            Back
          </button>

          <span
            style={{
              color:
                "#fff",
              fontWeight:
                700,
              fontSize: 18,
            }}
          >
            Order
          </span>

          <span
            style={{
              marginLeft:
                "auto",
              color:
                "rgba(255,255,255,0.92)",
              fontSize: 14,
            }}
          >
            Cart:{" "}
            {cart.length}{" "}
            item
            {cart.length !==
            1
              ? "s"
              : ""}
          </span>

          <button
            onClick={() =>
              setView("cart")
            }
            style={{
              background:
                "rgba(255,255,255,0.25)",
              border:
                "none",
              color: "#fff",
              borderRadius: 8,
              padding:
                "6px 14px",
              cursor:
                "pointer",
              fontSize: 14,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <ShoppingCart
              size={16}
              strokeWidth={
                2.25
              }
            />

            Cart
          </button>
        </header>

        <div
          className="customize-grid"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) minmax(280px, 360px)",
            width: "100%",
            padding: "28px 24px",
            gap: 24,
            boxSizing: "border-box",
          }}
        >
          <div
            className="customize-main"
            style={{
              width: "100%",
              minWidth: 0,
            }}
          >
            <div
              style={{
                marginBottom: 24,
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color:
                    col.accent,
                }}
              >
                {
                  selectedItem.name
                }
              </div>

              <div
                style={{
                  color:
                    "#5f6470",
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                {
                  selectedItem.desc
                }
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color:
                    col.accent,
                  marginTop: 6,
                }}
              >
                {formatPHP(
                  selectedItem.basePrice
                )}
              </div>
            </div>

            {isMatchaLatte && (
              <Section title="Matcha Powder">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {availableMatchaOptions(selectedItem).map((m) => (
                    <OptionCard
                      key={m.id}
                      selected={customize.powder === m.id}
                      onClick={() => setCustomize((c) => ({ ...c, powder: m.id }))}
                      accent={col.accent}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
                      <span style={{ fontSize: 12, color: customize.powder === m.id ? "rgba(255,255,255,0.9)" : "#5f6470" }}>
                        {m.price === 0 ? "No extra charge" : `+₱${m.price}`}
                      </span>
                    </OptionCard>
                  ))}
                </div>
              </Section>
            )}

            {isMatchaLatte && (
              <Section title="Matcha Level">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {MATCHA_LEVEL.map((m) => (
                    <PillBtn key={m.id} selected={customize.level === m.id} onClick={() => setCustomize((c) => ({ ...c, level: m.id }))} accent={col.accent}>
                      {m.label}
                    </PillBtn>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Sugar Level">
              <div
                style={{
                  display:
                    "flex",
                  gap: 8,
                  flexWrap:
                    "wrap",
                  justifyContent:
                    "center",
                }}
              >
                {SUGAR_LEVELS.map(
                  (s) => (
                    <PillBtn
                      key={
                        s.id
                      }
                      selected={
                        customize.sugar ===
                        s.id
                      }
                      onClick={() =>
                        setCustomize(
                          (current) => ({
                            ...current,
                            sugar:
                              s.id,
                          })
                        )
                      }
                      accent={
                        col.accent
                      }
                    >
                      {
                        s.label
                      }
                    </PillBtn>
                  )
                )}
              </div>
            </Section>

            <Section title="Ice Level">
              <div
                style={{
                  display:
                    "flex",
                  gap: 8,
                  flexWrap:
                    "wrap",
                  justifyContent:
                    "center",
                }}
              >
                {ICE_LEVELS.map(
                  (i) => (
                    <PillBtn
                      key={
                        i.id
                      }
                      selected={
                        customize.ice ===
                        i.id
                      }
                      onClick={() =>
                        setCustomize(
                          (current) => ({
                            ...current,
                            ice:
                              i.id,
                          })
                        )
                      }
                      accent={
                        col.accent
                      }
                    >
                      {
                        i.label
                      }
                    </PillBtn>
                  )
                )}
              </div>
            </Section>

            <Section title="Item Discount Code">
              <div
                style={{
                  display:
                    "flex",
                  gap: 8,
                }}
              >
                <input
                  className="light-field"
                  value={
                    customize.discountCode
                  }
                  onChange={(e) =>
                    setCustomize(
                      (current) => ({
                        ...current,
                        discountCode:
                          e.target.value.toUpperCase(),
                        discountError:
                          "",
                        appliedDiscount:
                          null,
                      })
                    )
                  }
                  placeholder="Enter code..."
                  style={{
                    flex: 1,
                    padding:
                      "8px 12px",
                    borderRadius: 8,
                    border:
                      "1px solid #ddd",
                    fontSize: 14,
                    fontFamily:
                      "monospace",
                  }}
                />

                <button
                  onClick={
                    applyItemDiscount
                  }
                  style={{
                    background:
                      col.accent,
                    color:
                      "#fff",
                    border:
                      "none",
                    borderRadius: 8,
                    padding:
                      "8px 16px",
                    cursor:
                      "pointer",
                    fontSize: 14,
                  }}
                >
                  Apply
                </button>
              </div>

              <div
                className="discount-row"
                style={{
                  display: "flex",
                  gap: 8,
                }}
              ></div>

              {customize.appliedDiscount && (
                <div
                  style={{
                    marginTop: 6,
                    color:
                      "#2d6a4f",
                    fontSize: 13,
                  }}
                >
                  ✓{" "}
                  {
                    DISCOUNT_CODES[
                      customize.appliedDiscount
                    ]?.desc
                  }{" "}
                  applied
                </div>
              )}

              {customize.discountError && (
                <div
                  style={{
                    marginTop: 6,
                    color:
                      "#dc2626",
                    fontSize: 13,
                  }}
                >
                  {
                    customize.discountError
                  }
                </div>
              )}
            </Section>
          </div>

          <div
            className="order-summary"
            style={{
              background:
                "#fff",
              borderRadius:
                16,
              border:
                "1px solid #e8e8e8",
              padding: 24,
              alignSelf:
                "start",
              position:
                "sticky",
              top: 20,
              width:
                "100%",
              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 16,
                color:
                  "#333",
                textAlign:
                  "center",
              }}
            >
              Order Summary
            </div>

            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#374151" }}>
                {selectedItem.name}
              </div>
            </div>

            {isMatchaLatte && (
              <Row
                label="Matcha Powder"
                val={
                  customize.powder === "koume"
                    ? "Koume"
                    : `Standard (${DRINK_MATCHA_BASE[selectedItem.name]})`
                }
                isTag
              />
            )}

            {isMatchaLatte && (
              <Row
                label="Matcha Level"
                val={
                  MATCHA_LEVEL.find(
                    (m) => m.id === customize.level
                  )?.label || customize.level
                }
              />
            )}

            <Row
              label="Sugar"
              val={
                SUGAR_LEVELS.find(
                  (s) =>
                    s.id ===
                    customize.sugar
                )?.label ||
                customize.sugar
              }
              isTag
            />

            <Row
              label="Ice"
              val={
                ICE_LEVELS.find(
                  (i) =>
                    i.id ===
                    customize.ice
                )?.label ||
                customize.ice
              }
              isTag
            />

            {customize.appliedDiscount && (
              <Row
                label={`Discount (${customize.appliedDiscount})`}
                val={
                  "-" +
                  formatPHP(
                    previewDiscount
                  )
                }
                isDiscount
              />
            )}

            <div
              style={{
                borderTop:
                  "1px solid #eee",
                marginTop: 12,
                paddingTop: 12,
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color:
                    "#374151",
                }}
              >
                Unit Price
              </span>

              <span
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color:
                    col.accent,
                }}
              >
                {formatPHP(
                  previewPrice
                )}
              </span>
            </div>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 12,
                marginTop: 16,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color:
                    "#4b5563",
                }}
              >
                Quantity
              </span>

              <button
                className="qty-btn light-field"
                onClick={() =>
                  setCustomize(
                    (current) => ({
                      ...current,
                      qty: Math.max(
                        1,
                        current.qty -
                          1
                      ),
                    })
                  )
                }
                disabled={
                  customize.qty ===
                  1
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border:
                    "1px solid #ddd",
                  background:
                    customize.qty ===
                    1
                      ? "#e5e7eb"
                      : "#f5f5f5",
                  cursor:
                    customize.qty ===
                    1
                      ? "not-allowed"
                      : "pointer",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  opacity:
                    customize.qty ===
                    1
                      ? 0.55
                      : 1,
                }}
              >
                <Minus
                  size={16}
                  strokeWidth={
                    2.5
                  }
                />
              </button>

              <span
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  minWidth: 24,
                  textAlign:
                    "center",
                  color:
                    "#111827",
                }}
              >
                {
                  customize.qty
                }
              </span>

              <button
                className="qty-btn light-field"
                onClick={() =>
                  setCustomize(
                    (current) => ({
                      ...current,
                      qty:
                        current.qty +
                        1,
                    })
                  )
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border:
                    "1px solid #ddd",
                  background:
                    "#f5f5f5",
                  cursor:
                    "pointer",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <Plus
                  size={16}
                  strokeWidth={
                    2.5
                  }
                />
              </button>
            </div>

            <div
              style={{
                marginTop: 8,
                textAlign:
                  "right",
                fontSize: 13,
                color:
                  "#6b7280",
              }}
            >
              Line total:{" "}
              {formatPHP(
                previewPrice *
                  customize.qty
              )}
            </div>

            <button
              onClick={
                addToCart
              }
              style={{
                width:
                  "100%",
                marginTop: 20,
                background:
                  col.accent,
                color:
                  "#fff",
                border:
                  "none",
                borderRadius:
                  12,
                padding:
                  "14px 0",
                fontSize: 16,
                fontWeight:
                  700,
                cursor:
                  "pointer",
              }}
            >
              Add to Cart →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * CART VIEW
   */

  if (view === "cart") {
    return (
      <div
        style={{
          fontFamily:
            "'Georgia', serif",
          background:
            "#faf8f5",
          minHeight:
            "100vh",
          display:
            "flex",
          flexDirection:
            "column",
        }}
      >
        <header
          className="history-header"
          style={{
            background: "#2d6a4f",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            onClick={() =>
              setView("menu")
            }
            style={{
              background:
                "rgba(255,255,255,0.2)",
              border:
                "none",
              color: "#fff",
              borderRadius: 8,
              padding:
                "6px 14px",
              cursor:
                "pointer",
              fontSize: 14,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <ArrowLeft
              size={16}
              strokeWidth={
                2.25
              }
            />

            Menu
          </button>

          <span
            style={{
              color:
                "#fff",
              fontWeight:
                700,
              fontSize: 20,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <ShoppingCart
              size={18}
              strokeWidth={
                2.25
              }
            />

            Current Order
          </span>
        </header>

        <div
          className="cart-grid"
          style={{
            flex: 1,
            padding: "28px 24px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 340px",
            gap: 24,
          }}
        >
          <div>
            {cart.length ===
            0 ? (
              <div
                style={{
                  textAlign:
                    "center",
                  padding:
                    "60px 0",
                  color:
                    "#6b7280",
                  fontSize: 18,
                }}
              >
                Cart is empty
                <br />

                <button
                  onClick={() =>
                    setView(
                      "menu"
                    )
                  }
                  style={{
                    marginTop: 16,
                    background:
                      "#2d6a4f",
                    color:
                      "#fff",
                    border:
                      "none",
                    borderRadius:
                      8,
                    padding:
                      "10px 24px",
                    cursor:
                      "pointer",
                    fontSize: 15,
                  }}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              cart.map(
                (item) => (
                  <CartItem
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    onRemove={() =>
                      removeFromCart(
                        item.id
                      )
                    }
                    onQtyChange={(
                      delta
                    ) =>
                      setCart(
                        (
                          current
                        ) =>
                          current.map(
                            (
                              cartItem
                            ) =>
                              cartItem.id ===
                              item.id
                                ? {
                                    ...cartItem,
                                    qty: Math.max(
                                      1,
                                      cartItem.qty +
                                        delta
                                    ),
                                  }
                                : cartItem
                          )
                      )
                    }
                  />
                )
              )
            )}
          </div>

          <div
            className="order-summary"
            style={{
              background:
                "#fff",
              borderRadius:
                16,
              border:
                "1px solid #e8e8e8",
              padding: 24,
              alignSelf:
                "start",
              position:
                "sticky",
              top: 20,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 16,
                color:
                  "#374151",
              }}
            >
              Order Total
            </div>

            <Row
              label="Subtotal"
              val={formatPHP(
                cartTotal
              )}
            />

            {appliedDiscount && (
              <Row
                label={`Discount (${appliedDiscount})`}
                val={
                  "-" +
                  formatPHP(
                    cartTotal -
                      billTotal
                  )
                }
                isDiscount
              />
            )}

            <div
              style={{
                borderTop:
                  "1px solid #eee",
                marginTop: 12,
                paddingTop: 12,
                display:
                  "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color:
                    "#374151",
                }}
              >
                Total
              </span>

              <span
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  color:
                    "#2d6a4f",
                }}
              >
                {formatPHP(
                  billTotal
                )}
              </span>
            </div>

            <div
              style={{
                marginTop: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color:
                    "#4b5563",
                  marginBottom: 6,
                }}
              >
                Order Discount Code
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: 8,
                }}
              >
                <input
                  className="light-field"
                  value={
                    discountCode
                  }
                  onChange={(e) => {
                    setDiscountCode(
                      e.target.value.toUpperCase()
                    );
                    setDiscountError(
                      ""
                    );
                    setAppliedDiscount(
                      null
                    );
                  }}
                  placeholder="CODE..."
                  style={{
                    flex: 1,
                    padding:
                      "8px 10px",
                    borderRadius: 8,
                    border:
                      "1px solid #ddd",
                    fontSize: 13,
                    fontFamily:
                      "monospace",
                  }}
                />

                <button
                  onClick={
                    applyOrderDiscount
                  }
                  style={{
                    background:
                      "#2d6a4f",
                    color:
                      "#fff",
                    border:
                      "none",
                    borderRadius:
                      8,
                    padding:
                      "8px 12px",
                    cursor:
                      "pointer",
                    fontSize: 13,
                  }}
                >
                  Apply
                </button>
              </div>

              {appliedDiscount && (
                <div
                  style={{
                    color:
                      "#2d6a4f",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  ✓{" "}
                  {
                    DISCOUNT_CODES[
                      appliedDiscount
                    ]?.desc
                  }
                </div>
              )}

              {discountError && (
                <div
                  style={{
                    color:
                      "#dc2626",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {
                    discountError
                  }
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color:
                    "#4b5563",
                  marginBottom: 8,
                }}
              >
                Payment Method
              </div>

              <div
                className="payment-method-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {[
                  {
                    id: "Cash",
                    icon: Banknote,
                    sub: "On hand",
                  },
                  {
                    id: "GCash",
                    icon: Smartphone,
                    sub: "QR / Ref #",
                  },
                  {
                    id: "Bank Transfer",
                    icon: Landmark,
                    sub: "Online",
                  },
                ].map(
                  (pm) => (
                    <div
                      key={
                        pm.id
                      }
                      onClick={() =>
                        setPaymentMethod(
                          pm.id
                        )
                      }
                      style={{
                        border: `2px solid ${
                          paymentMethod ===
                          pm.id
                            ? "#2d6a4f"
                            : "#e0e0e0"
                        }`,
                        background:
                          paymentMethod ===
                          pm.id
                            ? "#f0faf5"
                            : "#fafafa",
                        borderRadius:
                          10,
                        padding:
                          "10px 8px",
                        cursor:
                          "pointer",
                        textAlign:
                          "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 22,
                          display:
                            "flex",
                          justifyContent:
                            "center",
                        }}
                      >
                        <pm.icon
                          size={22}
                          strokeWidth={
                            2.2
                          }
                        />
                      </div>

                      <div
                        style={{
                          fontWeight:
                            700,
                          fontSize: 13,
                          color:
                            paymentMethod ===
                            pm.id
                              ? "#2d6a4f"
                              : "#444",
                          marginTop: 4,
                        }}
                      >
                        {
                          pm.id
                        }
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            "#6b7280",
                        }}
                      >
                        {
                          pm.sub
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {(paymentMethod === "GCash" ||
              paymentMethod === "Bank Transfer") && (
              <div
                style={{
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#4b5563",
                    marginBottom: 6,
                  }}
                >
                  Payment Screenshot
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    minHeight: 70,
                    padding: "12px",
                    boxSizing: "border-box",
                    border: "1px dashed #b7b7b7",
                    borderRadius: 8,
                    background: "#fafafa",
                    color: "#4b5563",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  <Paperclip size={17} />
                  <span>
                    {paymentImage
                      ? "Change attached image"
                      : "Attach payment screenshot"}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 5 * 1024 * 1024) {
                        window.alert("Please choose an image smaller than 5 MB.");
                        e.target.value = "";
                        return;
                      }

                      const reader = new FileReader();

                      reader.onload = () => {
                        const img = new Image();

                        img.onload = () => {
                          const MAX_DIMENSION = 1600;
                          const scale = Math.min(
                            1,
                            MAX_DIMENSION / Math.max(
                              img.naturalWidth,
                              img.naturalHeight
                            )
                          );

                          const canvas =
                            document.createElement("canvas");

                          canvas.width = Math.max(
                            1,
                            Math.round(
                              img.naturalWidth * scale
                            )
                          );

                          canvas.height = Math.max(
                            1,
                            Math.round(
                              img.naturalHeight * scale
                            )
                          );

                          const context =
                            canvas.getContext("2d");

                          context.drawImage(
                            img,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                          );

                          /*
                           * JPEG compression keeps screenshots visually
                           * clear while making them much smaller than the
                           * original camera/screenshot file.
                           */
                          const compressed =
                            canvas.toDataURL(
                              "image/jpeg",
                              0.72
                            );

                          setPaymentImage(
                            compressed
                          );
                        };

                        img.onerror = () => {
                          window.alert(
                            "Unable to read that image. Please choose another screenshot."
                          );
                        };

                        img.src =
                          reader.result;
                      };

                      reader.readAsDataURL(file);
                    }}
                    style={{ display: "none" }}
                  />
                </label>

                {paymentImage && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={paymentImage}
                      alt="Payment screenshot preview"
                      style={{
                        width: "100%",
                        maxHeight: 180,
                        objectFit: "contain",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        background: "#f5f5f5",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setPaymentImage(null)}
                      style={{
                        marginTop: 6,
                        width: "100%",
                        border: "1px solid #f0b5b5",
                        background: "#fff5f5",
                        color: "#dc2626",
                        borderRadius: 8,
                        padding: "7px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: 14,
              }}
            >
              <div style={{ marginTop: 14 }}>

              <div
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginBottom: 6,
                }}
              >
                Customer Name
              </div>

              <input
                className="light-field"
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                placeholder="Enter customer name..."
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
              <div
                style={{
                  fontSize: 13,
                  color:
                    "#4b5563",
                  marginBottom: 6,
                }}
              >
                Order Note
              </div>

              <textarea
                className="light-field"
                value={
                  orderNote
                }
                onChange={(e) =>
                  setOrderNote(
                    e.target.value
                  )
                }
                placeholder="Allergy notes, special requests..."
                style={{
                  width:
                    "100%",
                  padding:
                    "8px 10px",
                  borderRadius: 8,
                  border:
                    "1px solid #ddd",
                  fontSize: 13,
                  resize:
                    "vertical",
                  minHeight: 60,
                  boxSizing:
                    "border-box",
                }}
              />
            </div>

            <button
              disabled={
                cart.length ===
                0
              }
              onClick={
                checkout
              }
              style={{
                width:
                  "100%",
                marginTop: 16,
                background:
                  cart.length ===
                  0
                    ? "#ccc"
                    : "#2d6a4f",
                color:
                  "#fff",
                border:
                  "none",
                borderRadius:
                  12,
                padding:
                  "14px 0",
                fontSize: 16,
                fontWeight:
                  700,
                cursor:
                  cart.length ===
                  0
                    ? "default"
                    : "pointer",
              }}
            >
              Checkout & Print Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * CHECKOUT / RECEIPT VIEW
   */

  if (
    view === "checkout" &&
    completedOrder
  ) {
    return (
      <div
        style={{
          fontFamily:
            "'Georgia', serif",
          background:
            "#faf8f5",
          minHeight:
            "100vh",
          display:
            "flex",
          flexDirection:
            "column",
          alignItems:
            "center",
          padding:
            "40px 24px",
        }}
      >
        <div
          style={{
            background:
              "#fff",
            borderRadius:
              20,
            border:
              "1px solid #e0e0e0",
            width:
              "100%",
            maxWidth: 640,
            padding:
              "36px 36px 28px",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.07)",
            boxSizing:
              "border-box",
          }}
        >
          <div
            style={{
              textAlign:
                "center",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 40,
              }}
            >
              🍵
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color:
                  "#2d6a4f",
                marginTop: 8,
              }}
            >
              Order Placed!
            </div>

            <div
              style={{
                color:
                  "#4b5563",
                fontSize: 14,
              }}
            >
              {
                completedOrder.orderNum
              }{" "}
              ·{" "}
              {new Date(
                completedOrder.date
              ).toLocaleString(
                "en-PH"
              )}
            </div>
            {completedOrder.customerName && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: "#374151",
                  fontWeight: 600,
                }}
              >
                Customer: {completedOrder.customerName}
              </div>
            )}
          </div>

          <div
            style={{
              borderTop:
                "1px dashed #ddd",
              borderBottom:
                "1px dashed #ddd",
              padding:
                "16px 0",
              marginBottom: 16,
            }}
          >
            {completedOrder.items.map(
              (item, i) => (
                <div
                  key={i}
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 10,
                    fontSize: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight:
                          700,
                        color:
                          "#374151",
                      }}
                    >
                      {
                        item.name
                      }{" "}
                      <span
                        style={{
                          fontWeight:
                            400,
                        }}
                      >
                        ×
                        {
                          item.qty
                        }
                      </span>
                    </div>

                    <div
                      style={{
                        color:
                          "#4b5563",
                        fontSize: 12,
                      }}
                    >
                      {item.powder && DRINK_MATCHA_BASE[item.name] && (
                        <>
                          {item.powder === "koume" ? "Koume" : `Standard (${DRINK_MATCHA_BASE[item.name]})`} ·{" "}
                        </>
                      )}
                      {item.level && (
                        <>
                          {MATCHA_LEVEL.find((m) => m.id === item.level)?.label || item.level} ·{" "}
                        </>
                      )}
                      {SUGAR_LEVELS.find(
                        (s) =>
                          s.id ===
                          item.sugar
                      )?.label ||
                        item.sugar}{" "}
                      ·{" "}
                      {ICE_LEVELS.find(
                        (ice) =>
                          ice.id ===
                          item.ice
                      )?.label ||
                        item.ice}{" "}
                    </div>

                    {item.itemDiscount && (
                      <div
                        style={{
                          color:
                            "#2d6a4f",
                          fontSize: 11,
                        }}
                      >
                        Code:{" "}
                        {
                          item.itemDiscount
                        }
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontWeight:
                        700,
                      color:
                        "#374151",
                    }}
                  >
                    {formatPHP(
                      item.finalPrice *
                        item.qty
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <Row
            label="Subtotal"
            val={formatPHP(
              completedOrder.subtotal
            )}
          />

          {completedOrder.discountAmount >
            0 && (
            <Row
              label={`Discount (${completedOrder.orderDiscount})`}
              val={
                "-" +
                formatPHP(
                  completedOrder.discountAmount
                )
              }
              isDiscount
            />
          )}

          {completedOrder.note && (
            <Row
              label="Note"
              val={
                completedOrder.note
              }
              isTag
            />
          )}

          <Row
            label="Payment"
            val={
              completedOrder.paymentMethod ||
              "Cash"
            }
            isTag
          />

          {completedOrder.paymentImage && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #eee",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Payment Screenshot
              </div>

              <img
                src={completedOrder.paymentImage}
                alt="Payment screenshot"
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#f5f5f5",
                }}
              />
            </div>
          )}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              marginTop: 12,
              paddingTop: 12,
              borderTop:
                "1px solid #eee",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color:
                  "#374151",
              }}
            >
              Total Due
            </span>

            <span
              style={{
                fontWeight: 700,
                fontSize: 22,
                color:
                  "#2d6a4f",
              }}
            >
              {formatPHP(
                completedOrder.total
              )}
            </span>
          </div>

          <div
            style={{
              display:
                "flex",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              onClick={() =>
                setView("menu")
              }
              style={{
                flex: 1,
                background:
                  "#2d6a4f",
                color:
                  "#fff",
                border:
                  "none",
                borderRadius:
                  12,
                padding:
                  "12px 0",
                fontSize: 15,
                fontWeight:
                  700,
                cursor:
                  "pointer",
              }}
            >
              New Order
            </button>

            <button
              onClick={() =>
                setView("history")
              }
              style={{
                flex: 1,
                background:
                  "#f0faf5",
                color:
                  "#2d6a4f",
                border:
                  "1px solid #b7e4c7",
                borderRadius:
                  12,
                padding:
                  "12px 0",
                fontSize: 15,
                fontWeight:
                  700,
                cursor:
                  "pointer",
              }}
            >
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
   * HISTORY VIEW
   */

  if (view === "history") {
    return (
      <div
        style={{
          fontFamily:
            "'Georgia', serif",
          background:
            "#faf8f5",
          minHeight:
            "100vh",
        }}
      >
        <header
          className="history-header"
          style={{
            background: "#2d6a4f",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            onClick={() =>
              setView("menu")
            }
            style={{
              background:
                "rgba(255,255,255,0.2)",
              border:
                "none",
              color: "#fff",
              borderRadius: 8,
              padding:
                "6px 14px",
              cursor:
                "pointer",
              fontSize: 14,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <ArrowLeft
              size={16}
              strokeWidth={
                2.25
              }
            />

            Menu
          </button>

          <span
            style={{
              color:
                "#fff",
              fontWeight:
                700,
              fontSize: 20,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <History
              size={18}
              strokeWidth={
                2.25
              }
            />

            Order History
          </span>

          <div
            style={{
              marginLeft:
                "auto",
            }}
          >
            <button
              onClick={
                exportToExcel
              }
              style={{
                background:
                  "#fff",
                color:
                  "#2d6a4f",
                border:
                  "none",
                borderRadius:
                  8,
                padding:
                  "8px 16px",
                cursor:
                  "pointer",
                fontSize: 14,
                fontWeight:
                  700,
              }}
            >
              ⬇ Export Excel
            </button>
          </div>
        </header>

        <div
          style={{
            padding:
              "28px 24px",
          }}
        >
          <div
            className="history-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <StatCard
              label="Completed Orders"
              val={
                activeOrders.length
              }
            />

            <StatCard
              label="Total Revenue"
              val={formatPHP(
                todayRevenue
              )}
            />

            <StatCard
              label="Items Sold"
              val={activeOrders.reduce(
                (
                  sum,
                  order
                ) =>
                  sum +
                  order.items.reduce(
                    (
                      itemSum,
                      item
                    ) =>
                      itemSum +
                      Number(
                        item.qty ||
                          0
                      ),
                    0
                  ),
                0
              )}
            />

            <StatCard
              label="Cancelled"
              val={
                filteredHistory.filter(
                  (order) =>
                    order.cancelled
                ).length
              }
              isWarning
            />
          </div>

          <div
            className="history-filters"
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              "today",
              "all",
            ].map(
              (filter) => (
                <button
                  key={
                    filter
                  }
                  onClick={() =>
                    setHistoryFilter(
                      filter
                    )
                  }
                  style={{
                    padding:
                      "6px 18px",
                    borderRadius:
                      20,
                    border:
                      "1px solid #ddd",
                    background:
                      historyFilter ===
                      filter
                        ? "#2d6a4f"
                        : "#fff",
                    color:
                      historyFilter ===
                      filter
                        ? "#fff"
                        : "#444",
                    cursor:
                      "pointer",
                    fontSize: 13,
                    fontWeight:
                      600,
                  }}
                >
                  {filter ===
                  "today"
                    ? "Today"
                    : "All Time"}
                </button>
              )
            )}
          </div>

          {filteredHistory.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  "center",
                padding:
                  "60px 0",
                color:
                  "#6b7280",
              }}
            >
              No orders yet
            </div>
          ) : (
            [
              ...filteredHistory,
            ]
              .reverse()
              .map(
                (order) => (
                  <div
                    className="history-order-card"
                    key={order.orderNum}
                    style={{
                      background:
                        order.cancelled
                          ? "#fff8f8"
                          : "#fff",
                      borderRadius:
                        12,
                      border: `1px solid ${
                        order.cancelled
                          ? "#fca5a5"
                          : "#e8e8e8"
                      }`,
                      padding:
                        "16px 20px",
                      marginBottom: 12,
                      opacity:
                        order.cancelled
                          ? 0.9
                          : 1,
                    }}
                  >
                    <div
                      className="history-order-header"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        className="history-order-info"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight:
                              700,
                            color:
                              order.cancelled
                                ? "#9ca3af"
                                : "#2d6a4f",
                            textDecoration:
                              order.cancelled
                                ? "line-through"
                                : "none",
                          }}
                        >
                          {
                            order.orderNum
                          }
                        </span>

                        <span
                          style={{
                            color:
                              "#6b7280",
                            fontSize: 13,
                          }}
                        >
                          {new Date(
                            order.date
                          ).toLocaleString(
                            "en-PH"
                          )}
                        </span>

                        {order.customerName && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 13,
                              color: "#374151",
                              fontWeight: 600,
                            }}
                          >
                            Customer: {order.customerName}
                          </div>
                        )}

                        {!order.cancelled && (
                          <span
                            style={{
                              background:
                                order.status === "served"
                                  ? "#dcfce7"
                                  : "#fef3c7",
                              color:
                                order.status === "served"
                                  ? "#166534"
                                  : "#92400e",
                              border:
                                order.status === "served"
                                  ? "1px solid #86efac"
                                  : "1px solid #fcd34d",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 10px",
                            }}
                          >
                            {order.status === "served"
                              ? "✓ SERVED"
                              : "⏳ PENDING"}
                          </span>
                        )}

                        {order.cancelled && (
                          <>
                            <span
                              style={{
                                background:
                                  "#fee2e2",
                                color:
                                  "#dc2626",
                                border:
                                  "1px solid #fca5a5",
                                borderRadius:
                                  20,
                                fontSize: 11,
                                fontWeight:
                                  700,
                                padding:
                                  "2px 10px",
                              }}
                            >
                              ✕ CANCELLED
                            </span>

                            {order.cancelledAt && (
                              <span
                                style={{
                                  color:
                                    "#f87171",
                                  fontSize: 11,
                                }}
                              >
                                at{" "}
                                {new Date(
                                  order.cancelledAt
                                ).toLocaleString(
                                  "en-PH"
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div
                        className="history-order-actions"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              700,
                            fontSize: 16,
                            color:
                              order.cancelled
                                ? "#9ca3af"
                                : "#2d6a4f",
                            textDecoration:
                              order.cancelled
                                ? "line-through"
                                : "none",
                          }}
                        >
                          {formatPHP(
                            order.total
                          )}
                        </div>

                        {!order.cancelled && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            {order.status !== "served" && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Mark order ${order.orderNum} as served?`
                                    )
                                  ) {
                                    completeOrder(
                                      order.orderNum
                                    );
                                  }
                                }}
                                style={{
                                  background: "#f0faf5",
                                  border:
                                    "1px solid #86efac",
                                  color: "#166534",
                                  borderRadius: 8,
                                  padding: "5px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                ✓ Completed
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Cancel order ${order.orderNum}? It will remain in history as cancelled.`
                                  )
                                ) {
                                  cancelOrder(
                                    order.orderNum
                                  );
                                }
                              }}
                              style={{
                                background: "#fff",
                                border:
                                  "1px solid #fca5a5",
                                color: "#dc2626",
                                borderRadius: 8,
                                padding: "5px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                      }}
                    >
                      {order.items.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={index}
                            className="history-item-row"
                            style={{
                              fontSize: 13,
                              color: order.cancelled
                                ? "#9ca3af"
                                : "#555",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <span>
                              {
                                item.name
                              }{" "}
                              ×
                              {
                                item.qty
                              }{" "}
                              ·{" "}
                              {MATCHA_LEVEL.find(
                                (m) =>
                                  m.id ===
                                  item.level
                              )?.label ||
                                item.level}{" "}
                              ·{" "}
                              {SUGAR_LEVELS.find(
                                (s) =>
                                  s.id ===
                                  item.sugar
                              )?.label ||
                                item.sugar}{" "}
                              ·{" "}
                              {ICE_LEVELS.find(
                                (ice) =>
                                  ice.id ===
                                  item.ice
                              )?.label ||
                                item.ice}{" "}
                              ·{" "}
                            </span>

                            <span>
                              {formatPHP(
                                item.finalPrice *
                                  item.qty
                              )}
                            </span>
                          </div>
                        )
                      )}

                      {order.orderDiscount && (
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              order.cancelled
                                ? "#9ca3af"
                                : "#2d6a4f",
                            marginTop: 4,
                          }}
                        >
                          Order discount:{" "}
                          {
                            order.orderDiscount
                          }{" "}
                          (-{" "}
                          {formatPHP(
                            order.discountAmount
                          )}
                          )
                        </div>
                      )}

                      {order.note && (
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              "#5f6470",
                            marginTop: 2,
                          }}
                        >
                          Note:{" "}
                          {
                            order.note
                          }
                        </div>
                      )}

                      {order.paymentMethod &&
                        !order.cancelled && (
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Payment Method Tag */}
                            <span
                              style={{
                                fontSize: 11,
                                background:
                                  order.paymentMethod === "Cash"
                                    ? "#f0fdf4"
                                    : order.paymentMethod === "GCash"
                                    ? "#eff6ff"
                                    : "#fdf3e3",
                                color:
                                  order.paymentMethod === "Cash"
                                    ? "#166534"
                                    : order.paymentMethod === "GCash"
                                    ? "#1e40af"
                                    : "#92400e",
                                border: `1px solid ${
                                  order.paymentMethod === "Cash"
                                    ? "#bbf7d0"
                                    : order.paymentMethod === "GCash"
                                    ? "#bfdbfe"
                                    : "#fde68a"
                                }`,
                                borderRadius: 20,
                                padding: "2px 10px",
                                fontWeight: 600,
                              }}
                            >
                              {order.paymentMethod === "Cash"
                                ? "💵"
                                : order.paymentMethod === "GCash"
                                ? "📱"
                                : "🏦"}{" "}
                              {order.paymentMethod}
                            </span>

                            {/* View Payment Screenshot */}
                            {(order.paymentMethod === "GCash" ||
                              order.paymentMethod === "Bank Transfer") && (
                              <button
                                type="button"
                                onClick={async () => {
                                  let image = null;

                                  if (order.paymentImage) {
                                    image = order.paymentImage;
                                  } else if (order.paymentImageKey) {
                                    image = await getPaymentImage(
                                      order.paymentImageKey
                                    );
                                  }

                                  if (image) {
                                    setHistoryImage(image);
                                  } else {
                                    window.alert(
                                      "The payment screenshot could not be found."
                                    );
                                  }
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#f0faf5",
                                  color: "#2d6a4f",
                                  border: "1px solid #b7e4c7",
                                  borderRadius: 8,
                                  padding: "5px 10px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <Paperclip size={13} />
                                View Payment Screenshot
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )
              )
          )}
        </div>

        {historyImage && (
    <div
      onClick={() => setHistoryImage(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 700,
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 16,
          padding: 16,
          boxSizing: "border-box",
          overflow: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setHistoryImage(null)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            color: "#374151",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close payment screenshot"
        >
          ×
        </button>

        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#2d6a4f",
            marginBottom: 12,
            paddingRight: 40,
          }}
        >
          Payment Screenshot
        </div>

        <img
          src={historyImage}
          alt="Payment screenshot"
          style={{
            display: "block",
            width: "100%",
            maxHeight: "75vh",
            objectFit: "contain",
            borderRadius: 10,
            background: "#f5f5f5",
          }}
        />
      </div>
    </div>
  )}
      </div>
    );
  }

  /*
   * MAIN MENU VIEW
   */

  const col =
    CATEGORY_COLORS[
      activeCategory
    ] ||
    CATEGORY_COLORS[
      "Matcha Lattes"
    ];

  return (
    <div
      className="menu"
      style={{
        fontFamily:
          "'Georgia', serif",
        background:
          "#faf8f5",
        minHeight:
          "100vh",
      }}
    >
      <header
        className="history-header"
        style={{
          background: "#2d6a4f",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            color:
              "#fff",
            fontWeight:
              700,
            fontSize: 24,
          }}
        >
          🍵 Mei TEA POS
        </span>

        <div
          style={{
            marginLeft:
              "auto",
            display:
              "flex",
            alignItems:
              "center",
            gap: 12,
          }}
        >
          {cart.length >
            0 && (
            <>
              <span
                style={{
                  color:
                    "#fff",
                  fontSize: 14,
                }}
              >
                Cart:{" "}
                {
                  cart.length
                }
              </span>

              <button
                onClick={() =>
                  setView(
                    "cart"
                  )
                }
                style={{
                  background:
                    "rgba(255,255,255,0.25)",
                  border:
                    "none",
                  color:
                    "#fff",
                  borderRadius:
                    8,
                  padding:
                    "6px 14px",
                  cursor:
                    "pointer",
                  fontSize: 14,
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 8,
                }}
              >
                <ShoppingCart
                  size={16}
                  strokeWidth={
                    2.25
                  }
                />

                View Cart
              </button>
            </>
          )}

          <button
            onClick={() =>
              setView(
                "history"
              )
            }
            style={{
              background:
                "rgba(255,255,255,0.25)",
              border:
                "none",
              color:
                "#fff",
              borderRadius:
                8,
              padding:
                "6px 14px",
              cursor:
                "pointer",
              fontSize: 14,
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
            }}
          >
            <History
              size={16}
              strokeWidth={
                2.25
              }
            />

            History
          </button>
        </div>
      </header>

      <div
        className="history-content"
        style={{
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              margin:
                "0 0 14px",
              fontSize: 28,
              color:
                "#333",
              fontWeight:
                700,
              textAlign:
                "center",
            }}
          >
            Menu
          </h1>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {Object.keys(
              MENU
            ).map(
              (category) => (
                <button
                  key={
                    category
                  }
                  onClick={() =>
                    setActiveCategory(
                      category
                    )
                  }
                  style={{
                    padding:
                      "8px 16px",
                    borderRadius:
                      20,
                    border:
                      "1px solid #ddd",
                    background:
                      activeCategory ===
                      category
                        ? CATEGORY_COLORS[
                            category
                          ]
                            .accent
                        : "#fff",
                    color:
                      activeCategory ===
                      category
                        ? "#fff"
                        : "#444",
                    cursor:
                      "pointer",
                    fontSize: 14,
                    fontWeight:
                      600,
                    transition:
                      "all 0.2s",
                  }}
                >
                  {
                    CATEGORY_ICONS[
                      category
                    ]
                  }{" "}
                  {category}
                </button>
              )
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 320px))",
            gap: 18,
            width: "100%",
            boxSizing: "border-box",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {MENU[
            activeCategory
          ].map(
            (item) => (
              <div
                key={
                  item.id
                }
                onClick={() =>
                  openCustomize(
                    item
                  )
                }
                onMouseEnter={(
                  event
                ) =>
                  (event.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0,0,0,0.1)")
                }
                onMouseLeave={(
                  event
                ) =>
                  (event.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0,0,0,0.05)")
                }
                style={{
                  background:
                    "#fff",
                  borderRadius:
                    14,
                  border: `2px solid ${col.badge}`,
                  padding: 18,
                  textAlign:
                    "center",
                  cursor:
                    "pointer",
                  transition:
                    "all 0.2s",
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    marginBottom: 8,
                  }}
                >
                  {
                    CATEGORY_ICONS[
                      activeCategory
                    ]
                  }
                </div>

                <h2
                  style={{
                    margin:
                      "0 0 6px",
                    fontSize: 18,
                    fontWeight:
                      700,
                    color:
                      col.accent,
                  }}
                >
                  {
                    item.name
                  }
                </h2>

                <p
                  style={{
                    margin:
                      "0 0 10px",
                    fontSize: 13,
                    color:
                      "#6b7280",
                  }}
                >
                  {
                    item.desc
                  }
                </p>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight:
                      700,
                    color:
                      col.accent,
                  }}
                >
                  {formatPHP(
                    item.basePrice
                  )}
                </div>

                <button
                  onClick={(
                    event
                  ) => {
                    event.stopPropagation();
                    openCustomize(
                      item
                    );
                  }}
                  style={{
                    width:
                      "100%",
                    marginTop: 12,
                    background:
                      col.accent,
                    color:
                      "#fff",
                    border:
                      "none",
                    borderRadius:
                      8,
                    padding:
                      "8px 0",
                    fontSize: 14,
                    fontWeight:
                      700,
                    cursor:
                      "pointer",
                  }}
                >
                  Customize
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}) {
  return (
    <div
      style={{
        marginBottom: 24,
      }}
    >
      <h3
        style={{
          margin:
            "0 0 12px",
          fontSize: 14,
          fontWeight: 700,
          color:
            "#333",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.5px",
          textAlign:
            "center",
        }}
      >
        {title}
      </h3>

      {children}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  accent,
  children,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background:
          selected
            ? accent
            : "#f5f5f5",
        border: `2px solid ${
          selected
            ? accent
            : "#e0e0e0"
        }`,
        borderRadius:
          10,
        padding: 12,
        cursor:
          "pointer",
        transition:
          "all 0.15s",
        display:
          "flex",
        flexDirection:
          "column",
        gap: 4,
        alignItems:
          "center",
        color:
          selected
            ? "#fff"
            : "#333",
      }}
    >
      {children}
    </div>
  );
}

function PillBtn({
  selected,
  onClick,
  accent,
  children,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background:
          selected
            ? accent
            : "#f5f5f5",
        color:
          selected
            ? "#fff"
            : "#333",
        border: `2px solid ${
          selected
            ? accent
            : "#e0e0e0"
        }`,
        borderRadius:
          20,
        padding:
          "6px 16px",
        cursor:
          "pointer",
        fontSize: 14,
        fontWeight:
          600,
        transition:
          "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Row({
  label,
  val,
  isTag,
  isDiscount,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
        marginBottom: 8,
        fontSize: 13,
        gap: 12,
      }}
    >
      <span
        style={{
          color:
            isDiscount
              ? "#2d6a4f"
              : "#4b5563",
        }}
      >
        {label}
      </span>

      {isTag ? (
        <span
          style={{
            background:
              "#f0f0f0",
            color:
              "#333",
            borderRadius: 4,
            padding:
              "2px 8px",
            fontSize: 12,
            fontWeight:
              600,
            textAlign:
              "right",
          }}
        >
          {val}
        </span>
      ) : (
        <span
          style={{
            fontWeight:
              600,
            color:
              isDiscount
                ? "#2d6a4f"
                : "#333",
            textAlign:
              "right",
          }}
        >
          {val}
        </span>
      )}
    </div>
  );
}

function CartItem({
  item,
  onRemove,
  onQtyChange,
}) {
  const catColor =
    CATEGORY_COLORS[
      item.category
    ] ||
    CATEGORY_COLORS[
      "Matcha Lattes"
    ];

  return (
    <div
      style={{
        background:
          "#fff",
        borderRadius:
          12,
        border:
          "1px solid #e8e8e8",
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
        }}
      >
        <div
          style={{
            flex: 1,
          }}
        >
          <div
            style={{
              fontWeight:
                700,
              fontSize: 15,
              color:
                catColor.accent,
            }}
          >
            {item.name}
          </div>

          <div
            style={{
              color:
                "#6b7280",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {item.powder && DRINK_MATCHA_BASE[item.name] ? (item.powder === "koume" ? "Koume" : `Standard (${DRINK_MATCHA_BASE[item.name]})`) + " · " : ""}
            {item.level ? (MATCHA_LEVEL.find((m) => m.id === item.level)?.label || item.level) + " · " : ""}
            {SUGAR_LEVELS.find(
              (s) =>
                s.id ===
                item.sugar
            )?.label ||
              item.sugar}{" "}
            ·{" "}
            {ICE_LEVELS.find(
              (ice) =>
                ice.id ===
                item.ice
            )?.label ||
              item.ice}{" "}
          </div>

          {item.itemDiscount && (
            <div
              style={{
                color:
                  catColor.accent,
                fontSize: 11,
                marginTop: 4,
              }}
            >
              Discount:{" "}
              {
                item.itemDiscount
              }
            </div>
          )}
        </div>

        <button
          onClick={
            onRemove
          }
          style={{
            background:
              "#fee2e2",
            border:
              "none",
            color:
              "#dc2626",
            borderRadius:
              6,
            padding:
              "4px 10px",
            cursor:
              "pointer",
            fontSize: 12,
            fontWeight:
              700,
          }}
        >
          Remove
        </button>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap: 12,
          marginTop: 12,
          justifyContent:
            "space-between",
        }}
      >
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 8,
          }}
        >
          <button
            className="qty-btn light-field"
            onClick={() =>
              onQtyChange(
                -1
              )
            }
            disabled={
              item.qty ===
              1
            }
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border:
                "1px solid #ddd",
              background:
                item.qty ===
                1
                  ? "#e5e7eb"
                  : "#f5f5f5",
              cursor:
                item.qty ===
                1
                  ? "not-allowed"
                  : "pointer",
              display:
                "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              opacity:
                item.qty ===
                1
                  ? 0.55
                  : 1,
            }}
          >
            <Minus
              size={15}
              strokeWidth={
                2.5
              }
            />
          </button>

          <span
            style={{
              fontWeight:
                700,
              minWidth: 20,
              textAlign:
                "center",
              color:
                "#111827",
            }}
          >
            {
              item.qty
            }
          </span>

          <button
            className="qty-btn light-field"
            onClick={() =>
              onQtyChange(
                1
              )
            }
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border:
                "1px solid #ddd",
              background:
                "#f5f5f5",
              cursor:
                "pointer",
              display:
                "inline-flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <Plus
              size={15}
              strokeWidth={
                2.5
              }
            />
          </button>
        </div>

        <div
          style={{
            textAlign:
              "right",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color:
                "#6b7280",
            }}
          >
            Unit:{" "}
            {formatPHP(
              item.finalPrice
            )}
          </div>

          <div
            style={{
              fontWeight:
                700,
              fontSize: 16,
              color:
                catColor.accent,
            }}
          >
            {formatPHP(
              item.finalPrice *
                item.qty
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  val,
  isWarning,
}) {
  return (
    <div
      style={{
        background:
          isWarning
            ? "#fff5f5"
            : "#fff",
        borderRadius:
          12,
        border:
          isWarning
            ? "1px solid #fca5a5"
            : "1px solid #e8e8e8",
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color:
            isWarning
              ? "#dc2626"
              : "#4b5563",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color:
            isWarning
              ? "#dc2626"
              : "#2d6a4f",
        }}
      >
        {val}
      </div>
    </div>
  );
}

const rootContainer =
  document.getElementById(
    "root"
  );

if (!rootContainer) {
  throw new Error(
    "Root element not found"
  );
}

if (
  !rootContainer.__reactRoot
) {
  rootContainer.__reactRoot =
    ReactDOM.createRoot(
      rootContainer
    );
}

rootContainer.__reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (
  import.meta.env.PROD &&
  "serviceWorker" in
    navigator
) {
  window.addEventListener(
    "load",
    async () => {
      try {
        await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js`
        );

        console.log(
          "SW registered"
        );
      } catch (error) {
        console.error(
          error
        );
      }
    }
  );
}