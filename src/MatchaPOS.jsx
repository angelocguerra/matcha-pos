import { useRef, useState } from "react";
import * as XLSX from "xlsx";

const MENU = {
  "Matcha Lattes": [
    { id: "ml1", name: "Wang Wang Matcha Latte", basePrice: 260, desc: "Creamy signature blend, rich umami finish" },
    { id: "ml2", name: "Classic Matcha Latte", basePrice: 230, desc: "Ceremonial matcha, smooth milky balance" },
    { id: "ml3", name: "Jasmine Matcha Latte", basePrice: 250, desc: "Floral jasmine aroma, delicate matcha sweetness" },
    { id: "ml4", name: "Oolong Matcha Latte", basePrice: 250, desc: "Toasted oolong depth, earthy matcha fusion" },
    { id: "ml5", name: "Osmanthus Matcha Latte", basePrice: 250, desc: "Honeyed florals, soft velvety matcha taste" },
    { id: "ml6", name: "Sea Salt Foam Matcha Latte", basePrice: 280, desc: "Savory sea salt foam, creamy matcha layers" },
  ],
  "Milk Teas": [
    { id: "mt1", name: "Jasmine Milk Tea", basePrice: 180, desc: "Fragrant jasmine tea, creamy silky finish" },
    { id: "mt2", name: "Oolong Milk Tea", basePrice: 180, desc: "Roasted oolong flavor, smooth creamy blend" },
    { id: "mt3", name: "Osmanthus Milk Tea", basePrice: 180, desc: "Light floral sweetness, mellow tea aroma" },
  ],
  "Tea Clouds": [
    { id: "cf1", name: "Matcha Cloud Jasmine Tea", basePrice: 230, desc: "Creamy matcha cloud, light jasmine tea base" },
    { id: "cf2", name: "Hojicha Cloud Oolong Tea", basePrice: 210, desc: "Roasted hojicha foam, mellow oolong aroma" },
    { id: "cf3", name: "Sea Salt Cloud Osmanthus Tea", basePrice: 210, desc: "Sea salt cream cloud, fragrant osmanthus tea" },
  ],
};

const MATCHA_POWDERS = [
  { id: "yame", label: "Yame", price: 0 },
  { id: "nichi", label: "Nichi", price: 0 },
];

const SUGAR_LEVELS = ["Unsweetened", "Less Sweet", "Sweet"];
const ICE_LEVELS = ["No Ice", "Less Ice", "Regular Ice"];

const MILK_OPTIONS = [
  { id: "dairy", label: "Dairy Milk", price: 0 },
  { id: "oat", label: "Oat Milk", price: 0 },
  { id: "soy", label: "Soy Milk", price: 30 },
  { id: "meiji", label: "Meiji Fresh Milk", price: 30 },
];

const DISCOUNT_CODES = {
  MATCHA10: { type: "percent", value: 10, desc: "10% off" },
  STUDENT20: { type: "percent", value: 20, desc: "20% student discount" },
  FLAT50: { type: "flat", value: 50, desc: "₱50 off" },
  WELCOME: { type: "percent", value: 15, desc: "15% welcome discount" },
  BOGO: { type: "flat", value: 0, desc: "BOGO applied (manual)" },
};

const CATEGORY_ICONS = {
  "Matcha Lattes": "🍵",
  "Milk Teas": "🧋",
  "Tea Clouds": "☁️",
};

const CATEGORY_COLORS = {
  "Matcha Lattes": { accent: "#2d6a4f", badge: "#b7e4c7" },
  "Milk Teas": { accent: "#92400e", badge: "#fde68a" },
  "Tea Clouds": { accent: "#1e40af", badge: "#bfdbfe" },
};

const STORAGE_KEY = "matcha_pos_orders";

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveOrder(order) {
  const orders = loadOrders();
  orders.push(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function formatPHP(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const FRESH_CUSTOMIZE = {
  matcha: "yame",
  sugar: "Less Sweet",
  ice: "Regular Ice",
  milk: "oat",
  discountCode: "",
  appliedDiscount: null,
  discountError: "",
  qty: 1,
};

export default function MatchaPOS() {
  const [view, setView] = useState("menu");
  const [activeCategory, setActiveCategory] = useState("Matcha Lattes");
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState(loadOrders);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [completedOrder, setCompletedOrder] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("today");
  const [customize, setCustomize] = useState(FRESH_CUSTOMIZE);
  const orderNumberRef = useRef(1);

  const cartTotal = cart.reduce((sum, i) => sum + i.finalPrice * i.qty, 0);

  const getDiscount = (code, total) => {
    const d = DISCOUNT_CODES[code?.toUpperCase()];
    if (!d) return null;
    return d.type === "percent" ? (total * d.value) / 100 : d.value;
  };

  const billTotal = (() => {
    if (!appliedDiscount) return cartTotal;
    const d = DISCOUNT_CODES[appliedDiscount];
    if (!d) return cartTotal;
    return d.type === "percent"
      ? Math.max(0, cartTotal - (cartTotal * d.value) / 100)
      : Math.max(0, cartTotal - d.value);
  })();

  const computeItemPrice = (item, c) => {
    const matchaDelta = (MATCHA_POWDERS.find((m) => m.id === c.matcha) || {}).price || 0;
    const milkDelta = (MILK_OPTIONS.find((m) => m.id === c.milk) || {}).price || 0;
    const base = item.basePrice + matchaDelta + milkDelta;
    const itemDiscount = c.appliedDiscount ? getDiscount(c.appliedDiscount, base) || 0 : 0;
    return base - itemDiscount;
  };

  const openCustomize = (item) => {
    setSelectedItem(item);
    setCustomize(FRESH_CUSTOMIZE);
    setView("customize");
  };

  const addToCart = () => {
    const finalPrice = computeItemPrice(selectedItem, customize);
    setCart((c) => [...c, {
      id: Date.now() + Math.random(),
      itemId: selectedItem.id,
      name: selectedItem.name,
      category: activeCategory,
      basePrice: selectedItem.basePrice,
      finalPrice,
      qty: customize.qty,
      matcha: customize.matcha,
      sugar: customize.sugar,
      ice: customize.ice,
      milk: customize.milk,
      itemDiscount: customize.appliedDiscount,
    }]);
    setView("cart");
  };

  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));

  const applyOrderDiscount = () => {
    const code = discountCode.toUpperCase();
    if (!DISCOUNT_CODES[code]) {
      setDiscountError("Invalid discount code");
      setAppliedDiscount(null);
      return;
    }
    setAppliedDiscount(code);
    setDiscountError("");
  };

  const applyItemDiscount = () => {
    const code = customize.discountCode.toUpperCase();
    if (!DISCOUNT_CODES[code]) {
      setCustomize((c) => ({ ...c, discountError: "Invalid code", appliedDiscount: null }));
      return;
    }
    setCustomize((c) => ({ ...c, appliedDiscount: code, discountError: "" }));
  };

  const checkout = () => {
    const orderNum = `ORD-${String(orderNumberRef.current++).padStart(6, "0")}`;
    const order = {
      orderNum,
      date: new Date().toISOString(),
      items: cart,
      subtotal: cartTotal,
      orderDiscount: appliedDiscount,
      discountAmount: cartTotal - billTotal,
      total: billTotal,
      note: orderNote,
      paymentMethod,
      cancelled: false,
    };
    saveOrder(order);
    setOrderHistory(loadOrders());
    setCompletedOrder(order);
    setCart([]);
    setAppliedDiscount(null);
    setDiscountCode("");
    setOrderNote("");
    setPaymentMethod("Cash");
    setView("checkout");
  };

  const cancelOrder = (orderNum) => {
    const updated = loadOrders().map((o) =>
      o.orderNum === orderNum
        ? { ...o, cancelled: true, cancelledAt: new Date().toISOString() }
        : o
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setOrderHistory(updated);
  };

  const exportToExcel = () => {
    const orders = loadOrders();
    const rows = [];
    orders.forEach((ord) => {
      ord.items.forEach((item) => {
        rows.push({
          "Order #": ord.orderNum,
          "Date": new Date(ord.date).toLocaleString("en-PH"),
          "Status": ord.cancelled ? "CANCELLED" : "Completed",
          "Category": item.category,
          "Item": item.name,
          "Matcha Powder": MATCHA_POWDERS.find((m) => m.id === item.matcha)?.label || item.matcha,
          "Sugar Level": item.sugar,
          "Ice Level": item.ice,
          "Milk Type": MILK_OPTIONS.find((m) => m.id === item.milk)?.label || item.milk,
          "Qty": item.qty,
          "Unit Price (₱)": Number(item.finalPrice).toFixed(2),
          "Line Total (₱)": (item.finalPrice * item.qty).toFixed(2),
          "Item Discount Code": item.itemDiscount || "",
        });
      });
      rows.push({
        "Order #": ord.orderNum,
        "Date": "",
        "Status": ord.cancelled ? "CANCELLED" : "Completed",
        "Category": "",
        "Item": "ORDER TOTAL",
        "Matcha Powder": "",
        "Sugar Level": "",
        "Ice Level": "",
        "Milk Type": "",
        "Qty": "",
        "Unit Price (₱)": "",
        "Line Total (₱)": Number(ord.total).toFixed(2),
        "Item Discount Code": ord.orderDiscount || "",
        "Payment Method": ord.paymentMethod || "",
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [14, 20, 12, 18, 24, 14, 12, 14, 18, 6, 16, 14, 18, 16].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const completed = orders.filter((o) => !o.cancelled);
    const summary = [
      { Metric: "Total Orders (Completed)", Value: completed.length },
      { Metric: "Total Revenue (₱)", Value: completed.reduce((s, o) => s + o.total, 0).toFixed(2) },
      { Metric: "Total Discounts Given (₱)", Value: completed.reduce((s, o) => s + (o.discountAmount || 0), 0).toFixed(2) },
      { Metric: "Total Items Sold", Value: completed.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0) },
      { Metric: "Cancelled Orders", Value: orders.filter((o) => o.cancelled).length },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summary);
    ws2["!cols"] = [{ wch: 28 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");
    XLSX.writeFile(wb, `matcha_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const todayStr = new Date().toDateString();
  const filteredHistory = orderHistory.filter((o) =>
    historyFilter === "today" ? new Date(o.date).toDateString() === todayStr : true
  );
  const activeOrders = filteredHistory.filter((o) => !o.cancelled);
  const todayRevenue = activeOrders.reduce((s, o) => s + o.total, 0);

  // ─── CUSTOMIZE VIEW ──────────────────────────────────────────────────────────
  if (view === "customize" && selectedItem) {
    const col = CATEGORY_COLORS[activeCategory];
    const previewPrice = computeItemPrice(selectedItem, customize);
    return (
      <div style={{ fontFamily: "'Georgia', serif", background: "#faf8f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ background: col.accent, padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setView("menu")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>← Back</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Customize Order</span>
          <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.85)", fontSize: 14 }}>Cart: {cart.length} item{cart.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setView("cart")} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>🛒 Cart</button>
        </header>

        <div className="customize-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 360px)", maxWidth: 1180, margin: "0 auto", width: "100%", padding: "28px 24px", gap: 24, boxSizing: "border-box" }}>
          <div className="customize-main" style={{ width: "100%", minWidth: 0, paddingRight: 0 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: col.accent }}>{selectedItem.name}</div>
              <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>{selectedItem.desc}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: col.accent, marginTop: 6 }}>{formatPHP(selectedItem.basePrice)}</div>
            </div>

            <Section title="Matcha Powder">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MATCHA_POWDERS.map((m) => (
                  <OptionCard key={m.id} selected={customize.matcha === m.id} onClick={() => setCustomize((c) => ({ ...c, matcha: m.id }))} accent={col.accent}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: customize.matcha === m.id ? "rgba(255,255,255,0.8)" : "#888" }}>
                      {m.price === 0 ? "No extra charge" : m.price > 0 ? `+₱${m.price}` : `-₱${Math.abs(m.price)}`}
                    </span>
                  </OptionCard>
                ))}
              </div>
            </Section>

            <Section title="Sugar Level">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SUGAR_LEVELS.map((s) => (
                  <PillBtn key={s} selected={customize.sugar === s} onClick={() => setCustomize((c) => ({ ...c, sugar: s }))} accent={col.accent}>{s}</PillBtn>
                ))}
              </div>
            </Section>

            <Section title="Ice Level">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ICE_LEVELS.map((i) => (
                  <PillBtn key={i} selected={customize.ice === i} onClick={() => setCustomize((c) => ({ ...c, ice: i }))} accent={col.accent}>{i}</PillBtn>
                ))}
              </div>
            </Section>

            <Section title="Milk Type">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MILK_OPTIONS.map((m) => (
                  <OptionCard key={m.id} selected={customize.milk === m.id} onClick={() => setCustomize((c) => ({ ...c, milk: m.id }))} accent={col.accent}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: customize.milk === m.id ? "rgba(255,255,255,0.8)" : "#888" }}>{m.price === 0 ? "No extra charge" : `+₱${m.price}`}</span>
                  </OptionCard>
                ))}
              </div>
            </Section>

            <Section title="Item Discount Code">
              <div style={{ display: "flex", gap: 8 }}>
                <input className="light-field" value={customize.discountCode} onChange={(e) => setCustomize((c) => ({ ...c, discountCode: e.target.value.toUpperCase(), discountError: "", appliedDiscount: null }))} placeholder="Enter code..." style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "monospace" }} />
                <button onClick={applyItemDiscount} style={{ background: col.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14 }}>Apply</button>
              </div>
              {customize.appliedDiscount && <div style={{ marginTop: 6, color: "#2d6a4f", fontSize: 13 }}>✓ {DISCOUNT_CODES[customize.appliedDiscount]?.desc} applied</div>}
              {customize.discountError && <div style={{ marginTop: 6, color: "#dc2626", fontSize: 13 }}>{customize.discountError}</div>}
            </Section>
          </div>

          <div className="order-summary" style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: 24, alignSelf: "start", position: "sticky", top: 20, width: "100%", boxSizing: "border-box" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#333" }}>Order Summary</div>
            <Row label={selectedItem.name} val={formatPHP(selectedItem.basePrice)} />
            {
              (() => {
                const milkOpt = MILK_OPTIONS.find((m) => m.id === customize.milk) || {};
                return (
                  <Row
                    label="Milk"
                    val={milkOpt.label + (milkOpt.price > 0 ? ` (+${formatPHP(milkOpt.price)})` : "")}
                  />
                );
              })()
            }
            <Row label="Sugar" val={customize.sugar} isTag />
            <Row label="Ice" val={customize.ice} isTag />
            <Row label="Matcha" val={MATCHA_POWDERS.find((m) => m.id === customize.matcha)?.label} isTag />
            {customize.appliedDiscount && (
              <Row label={`Discount (${customize.appliedDiscount})`} val={"-" + formatPHP(getDiscount(customize.appliedDiscount, previewPrice) || 0)} isDiscount />
            )}
            <div style={{ borderTop: "1px solid #eee", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>Unit Price</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: col.accent }}>{formatPHP(previewPrice)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <span style={{ fontSize: 14, color: "#666" }}>Quantity</span>
              <button className="qty-btn light-field" onClick={() => setCustomize((c) => ({ ...c, qty: Math.max(1, c.qty - 1) }))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>−</button>
              <span style={{ fontWeight: 700, fontSize: 18, minWidth: 24, textAlign: "center" }}>{customize.qty}</span>
              <button className="qty-btn light-field" onClick={() => setCustomize((c) => ({ ...c, qty: c.qty + 1 }))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>+</button>
            </div>
            <div style={{ marginTop: 8, textAlign: "right", fontSize: 13, color: "#999" }}>Line total: {formatPHP(previewPrice * customize.qty)}</div>
            <button onClick={addToCart} style={{ width: "100%", marginTop: 20, background: col.accent, color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Add to Cart →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CART VIEW ───────────────────────────────────────────────────────────────
  if (view === "cart") {
    return (
      <div style={{ fontFamily: "'Georgia', serif", background: "#faf8f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "#2d6a4f", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setView("menu")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>← Menu</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>🛒 Current Order</span>
        </header>

        <div className="cart-grid" style={{ flex: 1, maxWidth: 900, margin: "0 auto", width: "100%", padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          <div>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: 18 }}>
                Cart is empty<br />
                <button onClick={() => setView("menu")} style={{ marginTop: 16, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 15 }}>Browse Menu</button>
              </div>
            ) : (
              cart.map((item) => (
                <CartItem key={item.id} item={item}
                  onRemove={() => removeFromCart(item.id)}
                  onQtyChange={(d) => setCart((c) => c.map((ci) => ci.id === item.id ? { ...ci, qty: Math.max(1, ci.qty + d) } : ci))} />
              ))
            )}
          </div>

          <div className="order-summary" style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: 24, alignSelf: "start", position: "sticky", top: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Order Total</div>
            <Row label="Subtotal" val={formatPHP(cartTotal)} />
            {appliedDiscount && <Row label={`Discount (${appliedDiscount})`} val={"-" + formatPHP(cartTotal - billTotal)} isDiscount />}
            <div style={{ borderTop: "1px solid #eee", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 20, color: "#2d6a4f" }}>{formatPHP(billTotal)}</span>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Order Discount Code</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="light-field" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(""); setAppliedDiscount(null); }} placeholder="CODE..." style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, fontFamily: "monospace" }} />
                <button onClick={applyOrderDiscount} style={{ background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13 }}>Apply</button>
              </div>
              {appliedDiscount && <div style={{ color: "#2d6a4f", fontSize: 12, marginTop: 4 }}>✓ {DISCOUNT_CODES[appliedDiscount]?.desc}</div>}
              {discountError && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{discountError}</div>}
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Payment Method</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { id: "Cash", icon: "💵", sub: "On hand" },
                  { id: "GCash", icon: "📱", sub: "QR / Ref #" },
                  { id: "Bank Transfer", icon: "🏦", sub: "Online" },
                ].map((pm) => (
                  <div key={pm.id} onClick={() => setPaymentMethod(pm.id)} style={{ border: `2px solid ${paymentMethod === pm.id ? "#2d6a4f" : "#e0e0e0"}`, background: paymentMethod === pm.id ? "#f0faf5" : "#fafafa", borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.12s" }}>
                    <div style={{ fontSize: 22 }}>{pm.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: paymentMethod === pm.id ? "#2d6a4f" : "#444", marginTop: 4 }}>{pm.id}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{pm.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Order Note</div>
              <textarea className="light-field" value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="Allergy notes, special requests..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, resize: "vertical", minHeight: 60, boxSizing: "border-box" }} />
            </div>

            <button disabled={cart.length === 0} onClick={checkout} style={{ width: "100%", marginTop: 16, background: cart.length === 0 ? "#ccc" : "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 16, fontWeight: 700, cursor: cart.length === 0 ? "default" : "pointer" }}>
              Checkout & Print Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT / RECEIPT VIEW ─────────────────────────────────────────────────
  if (view === "checkout" && completedOrder) {
    return (
      <div style={{ fontFamily: "'Georgia', serif", background: "#faf8f5", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e0e0e0", maxWidth: 520, width: "100%", padding: "36px 36px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40 }}>🍵</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2d6a4f", marginTop: 8 }}>Order Placed!</div>
            <div style={{ color: "#888", fontSize: 14 }}>{completedOrder.orderNum} · {new Date(completedOrder.date).toLocaleString("en-PH")}</div>
          </div>
          <div style={{ borderTop: "1px dashed #ddd", borderBottom: "1px dashed #ddd", padding: "16px 0", marginBottom: 16 }}>
            {completedOrder.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name} <span style={{ fontWeight: 400, color: "#888" }}>×{item.qty}</span></div>
                  <div style={{ color: "#aaa", fontSize: 12 }}>
                    {MATCHA_POWDERS.find((m) => m.id === item.matcha)?.label} · {item.sugar} · {item.ice} · {MILK_OPTIONS.find((m) => m.id === item.milk)?.label}
                  </div>
                  {item.itemDiscount && <div style={{ color: "#2d6a4f", fontSize: 11 }}>Code: {item.itemDiscount}</div>}
                </div>
                <div style={{ fontWeight: 600 }}>{formatPHP(item.finalPrice * item.qty)}</div>
              </div>
            ))}
          </div>
          <Row label="Subtotal" val={formatPHP(completedOrder.subtotal)} />
          {completedOrder.discountAmount > 0 && <Row label={`Discount (${completedOrder.orderDiscount})`} val={"-" + formatPHP(completedOrder.discountAmount)} isDiscount />}
          {completedOrder.note && <Row label="Note" val={completedOrder.note} isTag />}
          <Row label="Payment" val={completedOrder.paymentMethod || "Cash"} isTag />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Total Due</span>
            <span style={{ fontWeight: 700, fontSize: 22, color: "#2d6a4f" }}>{formatPHP(completedOrder.total)}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button onClick={() => setView("menu")} style={{ flex: 1, background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>New Order</button>
            <button onClick={() => setView("history")} style={{ flex: 1, background: "#f0faf5", color: "#2d6a4f", border: "1px solid #b7e4c7", borderRadius: 12, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>View History</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── HISTORY VIEW ────────────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <div style={{ fontFamily: "'Georgia', serif", background: "#faf8f5", minHeight: "100vh" }}>
        <header style={{ background: "#2d6a4f", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setView("menu")} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>← Menu</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>📊 Order History</span>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={exportToExcel} style={{ background: "#fff", color: "#2d6a4f", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>⬇ Export Excel</button>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            <StatCard label="Completed Orders" val={activeOrders.length} />
            <StatCard label="Total Revenue" val={formatPHP(todayRevenue)} />
            <StatCard label="Items Sold" val={activeOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0)} />
            <StatCard label="Cancelled" val={filteredHistory.filter((o) => o.cancelled).length} isWarning />
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {["today", "all"].map((f) => (
              <button key={f} onClick={() => setHistoryFilter(f)} style={{ padding: "6px 18px", borderRadius: 20, border: "1px solid #ddd", background: historyFilter === f ? "#2d6a4f" : "#fff", color: historyFilter === f ? "#fff" : "#444", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {f === "today" ? "Today" : "All Time"}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>No orders yet</div>
          ) : (
            [...filteredHistory].reverse().map((ord) => (
              <div key={ord.orderNum} style={{ background: ord.cancelled ? "#fff8f8" : "#fff", borderRadius: 12, border: `1px solid ${ord.cancelled ? "#fca5a5" : "#e8e8e8"}`, padding: "16px 20px", marginBottom: 12, opacity: ord.cancelled ? 0.9 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: ord.cancelled ? "#9ca3af" : "#2d6a4f", textDecoration: ord.cancelled ? "line-through" : "none" }}>{ord.orderNum}</span>
                    <span style={{ color: "#999", fontSize: 13 }}>{new Date(ord.date).toLocaleString("en-PH")}</span>
                    {ord.cancelled && (
                      <>
                        <span style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 10px" }}>✕ CANCELLED</span>
                        {ord.cancelledAt && <span style={{ color: "#f87171", fontSize: 11 }}>at {new Date(ord.cancelledAt).toLocaleString("en-PH")}</span>}
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: ord.cancelled ? "#9ca3af" : "#2d6a4f", textDecoration: ord.cancelled ? "line-through" : "none" }}>{formatPHP(ord.total)}</div>
                    {!ord.cancelled && (
                      <button
                        onClick={() => { if (window.confirm(`Cancel order ${ord.orderNum}? It will remain in history as cancelled.`)) cancelOrder(ord.orderNum); }}
                        style={{ background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {ord.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: ord.cancelled ? "#9ca3af" : "#555", display: "flex", justifyContent: "space-between" }}>
                      <span>{item.name} ×{item.qty} · {item.sugar} · {item.ice} · {MILK_OPTIONS.find((m) => m.id === item.milk)?.label}</span>
                      <span>{formatPHP(item.finalPrice * item.qty)}</span>
                    </div>
                  ))}
                  {ord.orderDiscount && (
                    <div style={{ fontSize: 12, color: ord.cancelled ? "#9ca3af" : "#2d6a4f", marginTop: 4 }}>
                      Order discount: {ord.orderDiscount} (-{formatPHP(ord.discountAmount)})
                    </div>
                  )}
                  {ord.note && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Note: {ord.note}</div>}
                  {ord.paymentMethod && !ord.cancelled && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{
                        fontSize: 11,
                        background: ord.paymentMethod === "Cash" ? "#f0fdf4" : ord.paymentMethod === "GCash" ? "#eff6ff" : "#fdf3e3",
                        color: ord.paymentMethod === "Cash" ? "#166534" : ord.paymentMethod === "GCash" ? "#1e40af" : "#92400e",
                        border: `1px solid ${ord.paymentMethod === "Cash" ? "#bbf7d0" : ord.paymentMethod === "GCash" ? "#bfdbfe" : "#fde68a"}`,
                        borderRadius: 20, padding: "2px 10px", fontWeight: 600,
                      }}>
                        {ord.paymentMethod === "Cash" ? "💵" : ord.paymentMethod === "GCash" ? "📱" : "🏦"} {ord.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN MENU VIEW ──────────────────────────────────────────────────────────
  const col = CATEGORY_COLORS[activeCategory];
  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#faf8f5", minHeight: "100vh" }}>
      <header style={{ background: "#2d6a4f", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 24 }}>🍵 Mei TEA POS</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {cart.length > 0 && (
            <>
              <span style={{ color: "#fff", fontSize: 14 }}>Cart: {cart.length}</span>
              <button onClick={() => setView("cart")} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>🛒 View Cart</button>
            </>
          )}
          <button onClick={() => setView("history")} style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>📊 History</button>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 14px", fontSize: 28, color: "#333", fontWeight: 700 }}>Menu</h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.keys(MENU).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "1px solid #ddd",
                  background: activeCategory === cat ? CATEGORY_COLORS[cat].accent : "#fff",
                  color: activeCategory === cat ? "#fff" : "#444",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {MENU[activeCategory].map((item) => (
            <div
              key={item.id}
              onClick={() => openCustomize(item)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)")}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: `2px solid ${col.badge}`,
                padding: 18,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{CATEGORY_ICONS[activeCategory]}</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: col.accent }}>{item.name}</h2>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#999" }}>{item.desc}</p>
              <div style={{ fontSize: 18, fontWeight: 700, color: col.accent }}>{formatPHP(item.basePrice)}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCustomize(item);
                }}
                style={{
                  width: "100%",
                  marginTop: 12,
                  background: col.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Customize & Order
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#333", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, accent, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? accent : "#f5f5f5",
        border: `2px solid ${selected ? accent : "#e0e0e0"}`,
        borderRadius: 10,
        padding: 12,
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        color: selected ? "#fff" : "#333",
      }}
    >
      {children}
    </div>
  );
}

function PillBtn({ selected, onClick, accent, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? accent : "#f5f5f5",
        color: selected ? "#fff" : "#333",
        border: `2px solid ${selected ? accent : "#e0e0e0"}`,
        borderRadius: 20,
        padding: "6px 16px",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 600,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function Row({ label, val, isTag, isDiscount }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: isDiscount ? "#2d6a4f" : "#666" }}>{label}</span>
      {isTag ? (
        <span style={{ background: "#f0f0f0", color: "#333", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>{val}</span>
      ) : (
        <span style={{ fontWeight: 600, color: isDiscount ? "#2d6a4f" : "#333" }}>{val}</span>
      )}
    </div>
  );
}

function CartItem({ item, onRemove, onQtyChange }) {
  const catColor = CATEGORY_COLORS[item.category];
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e8e8", padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: catColor.accent }}>{item.name}</div>
          <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
            {MATCHA_POWDERS.find((m) => m.id === item.matcha)?.label} · {item.sugar} · {item.ice} · {MILK_OPTIONS.find((m) => m.id === item.milk)?.label}
          </div>
          {item.itemDiscount && <div style={{ color: catColor.accent, fontSize: 11, marginTop: 4 }}>Discount: {item.itemDiscount}</div>}
        </div>
        <button
          onClick={onRemove}
          style={{ background: "#fee2e2", border: "none", color: "#dc2626", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >
          Remove
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="qty-btn light-field"
            onClick={() => onQtyChange(-1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
          >
            −
          </button>
          <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
          <button className="qty-btn light-field"
            onClick={() => onQtyChange(1)}
            style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 16, fontWeight: 700 }}
          >
            +
          </button>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#999" }}>Unit: {formatPHP(item.finalPrice)}</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: catColor.accent }}>{formatPHP(item.finalPrice * item.qty)}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, val, isWarning }) {
  return (
    <div style={{ background: isWarning ? "#fff5f5" : "#fff", borderRadius: 12, border: isWarning ? "1px solid #fca5a5" : "1px solid #e8e8e8", padding: 18 }}>
      <div style={{ fontSize: 13, color: isWarning ? "#dc2626" : "#666", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: isWarning ? "#dc2626" : "#2d6a4f" }}>{val}</div>
    </div>
  );
}