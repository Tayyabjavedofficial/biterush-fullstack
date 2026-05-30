import React, { useState, useEffect } from "react";
import {
  Search, Bell, MapPin, ChevronDown, SlidersHorizontal, Flame, Star, Clock,
  Navigation, ArrowLeft, Plus, Minus, Check, ShoppingBag, Receipt, Heart,
  CreditCard, Wallet, MapPin as Pin, Settings, LogOut, ChevronRight, User,
  ChevronLeft,
} from "lucide-react";
import { ThemeToggle, HeroCarousel, FoodCard, Dish } from "./components.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useCart } from "./context/CartContext.jsx";
import { api } from "./api.js";

const DELIVERY_FEE = 2.99;

/* ---------------------------------- Auth ---------------------------------- */
export function Auth({ onDone, onBack, theme, setTheme }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      onDone();
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card glass">
        <div className="d-head">
          <button className="icon-btn" onClick={onBack}><ArrowLeft size={19} /></button>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <div className="brand">Bite<span>Rush</span></div>
        <div className="sub">Crave it. Tap it. Get it.</div>

        <div className="seg">
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); }}>Log in</button>
          <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setErr(""); }}>Sign up</button>
        </div>

        {err && <div className="err">{err}</div>}

        {mode === "register" && (
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tayyab Khan" />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 4 characters" />
        </div>

        <button className="cta" onClick={submit} disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        <div className="muted-note">Accounts and orders are stored in the backend SQLite database. Create an account to get started.</div>
      </div>
    </div>
  );
}

/* ---------------------------------- Home ---------------------------------- */
export function Home({ foods, categories, onOpen, theme, setTheme }) {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const allCats = [{ id: 0, name: "All", emoji: "🍽️" }, ...categories];

  let list = cat === "All" ? foods : foods.filter((f) => f.category === cat);
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((f) => f.name.toLowerCase().includes(q) || f.restaurant.toLowerCase().includes(q));
  }
  const popular = [...foods].sort((a, b) => b.rating - a.rating).slice(0, 5);

  return (
    <div className="container">
      <header className="header">
        <div className="loc">
          <div className="loc-ic"><MapPin size={18} /></div>
          <div className="loc-txt">
            <small>Deliver to</small>
            <span>Naperville, IL <ChevronDown size={14} /></span>
          </div>
        </div>
        <div className="h-right">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button className="icon-btn"><Bell size={18} /><span className="dot" /></button>
        </div>
      </header>

      <div className="greet">
        <small>Hey there,</small>
        <h1>What would you like<br />to eat today?</h1>
      </div>

      <div className="search glass">
        <Search size={19} color="var(--muted)" />
        <input placeholder="Search for dishes or restaurants" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="filt"><SlidersHorizontal size={17} /></div>
      </div>

      <HeroCarousel />

      <div className="chips">
        {allCats.map((c) => (
          <div key={c.name} className={"chip" + (cat === c.name ? " on" : "")} onClick={() => setCat(c.name)}>
            <span className="em">{c.emoji}</span>{c.name}
          </div>
        ))}
      </div>

      <RecommendedCarousel foods={list} onOpen={onOpen} />

      <PopularCarousel foods={popular} onOpen={onOpen} />
    </div>
  );
}

/* -------------------------------- Carousel -------------------------------- */
function PopularCarousel({ foods, onOpen }) {
  const scrollRef = React.useRef(null);
  const [page, setPage] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const updatePage = () => {
    if (!scrollRef.current) return;
    const cardWidth = 240 + 14;
    const scrollPos = scrollRef.current.scrollLeft;
    const newPage = Math.round(scrollPos / (cardWidth * 3));
    setPage(Math.min(newPage, Math.ceil(foods.length / 3) - 1));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updatePage();
  };

  const totalPages = Math.ceil(foods.length / 3);

  return (
    <>
      <div className="sec-head" style={{ marginTop: 26 }}>
        <h2><Flame size={17} style={{ verticalAlign: -3, color: "var(--accent-ink)" }} /> Popular near you</h2>
        <a>See all</a>
      </div>
      <div className="carousel-container">
        <div
          className="hrow"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {foods.map((f) => (
            <div key={f.id} className="hcard glass" onClick={() => onOpen(f)} style={{ userSelect: "none" }}>
              <div className="hi"><Dish src={f.img} emoji={f.emoji} /></div>
              <div>
                <h4>{f.name}</h4>
                <div className="meta"><Star size={12} className="star" fill="currentColor" /> {f.rating} · {f.time}</div>
                <div className="hp">${f.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="carousel-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={page === i ? "active" : ""} />
          ))}
        </div>
      </div>
    </>
  );
}

function RecommendedCarousel({ foods, onOpen }) {
  const scrollRef = React.useRef(null);
  const [page, setPage] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const updatePage = () => {
    if (!scrollRef.current) return;
    const cardWidth = 158 + 14;
    const scrollPos = scrollRef.current.scrollLeft;
    const newPage = Math.round(scrollPos / (cardWidth * 3));
    setPage(Math.min(newPage, Math.ceil(foods.length / 3) - 1));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updatePage();
  };

  if (foods.length === 0) {
    return <div className="empty"><div className="big">🔎</div><p>No dishes match your search.</p></div>;
  }

  const totalPages = Math.ceil(foods.length / 3);

  return (
    <>
      <div className="sec-head">
        <h2>Recommended for you</h2>
        <a>See all</a>
      </div>
      <div className="carousel-container">
        <div
          className="food-carousel"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {foods.map((f, i) => (
            <FoodCard key={f.id} food={f} onOpen={onOpen} delay={i * 60} />
          ))}
        </div>
        <div className="carousel-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={page === i ? "active" : ""} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Food Detail ------------------------------ */
export function FoodDetail({ food, onBack, theme, setTheme }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);

  function addToCart() {
    add(food, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  }

  const text = food.description || "";
  return (
    <div className="detail">
      <div className="detail-grid">
        <div className="d-head" style={{ gridColumn: "1 / -1" }}>
          <button className="icon-btn" onClick={onBack}><ArrowLeft size={19} /></button>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>

        <div className="hero-d">
          <div className="plate"><Dish src={food.img} emoji={food.emoji} /></div>
        </div>

        <div className="sheet glass reveal">
          <div className="title-row">
            <div>
              <h1>{food.name}</h1>
              <div className="rest">{food.restaurant}</div>
            </div>
            <div className="bigp">${food.price.toFixed(2)}</div>
          </div>

          <div className="facts">
            <span className="fact"><Star size={16} className="star" fill="currentColor" /> {food.rating}</span>
            <span className="fact"><Clock size={16} /> {food.time}</span>
            <span className="fact"><Navigation size={15} /> {food.distance}</span>
          </div>

          <div className="nutri">
            <div className="mini glass"><b>{food.kcal}</b><small>kcal</small></div>
            <div className="mini glass"><b>{food.protein}g</b><small>protein</small></div>
            <div className="mini glass"><b>{food.fat}g</b><small>fat</small></div>
            <div className="mini glass"><b>{food.carbs}g</b><small>carbs</small></div>
          </div>

          <h3>Details</h3>
          <p className="desc">
            {expanded || text.length <= 96 ? text : text.slice(0, 92) + "… "}
            {!expanded && text.length > 96 && <span className="readmore" onClick={() => setExpanded(true)}>Read more</span>}
          </p>

          <div className="qtyrow">
            <span className="lbl">Quantity</span>
            <div className="qty glass">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}><Plus size={16} /></button>
            </div>
          </div>

          <button className={"cta" + (added ? " added" : "")} onClick={addToCart}>
            {added ? <><Check size={19} /> Added to cart</> : <>Add to cart · ${(food.price * qty).toFixed(2)}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Cart ---------------------------------- */
export function Cart({ go, theme, setTheme }) {
  const { items, setQty, remove, total } = useCart();
  const { user } = useAuth();
  const delivery = items.length ? DELIVERY_FEE : 0;
  const grand = Math.round((total + delivery) * 100) / 100;

  function checkout() {
    if (!user) go("auth", { next: "checkout" });
    else go("checkout");
  }

  return (
    <div className="page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
        <h1>Your Cart</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="big">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse the menu and add something delicious.</p>
          <button className="cta inline" onClick={() => go("home")}>Browse menu</button>
        </div>
      ) : (
        <>
          {items.map(({ food, qty }) => (
            <div className="cart-item glass" key={food.id}>
              <div className="ci-img"><Dish src={food.img} emoji={food.emoji} /></div>
              <div className="ci-info">
                <h4>{food.name}</h4>
                <div className="p">${food.price.toFixed(2)}</div>
              </div>
              <div className="ci-side">
                <button className="rm" onClick={() => remove(food.id)}><Heart size={0} style={{ display: "none" }} /><span style={{ fontSize: 12, fontWeight: 700 }}>Remove</span></button>
                <div className="qty sm glass">
                  <button onClick={() => setQty(food.id, qty - 1)}><Minus size={14} /></button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(food.id, qty + 1)}><Plus size={14} /></button>
                </div>
              </div>
            </div>
          ))}

          <div className="summary glass">
            <div className="sumrow"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="sumrow"><span>Delivery fee</span><span>${delivery.toFixed(2)}</span></div>
            <div className="sumrow total"><span>Total</span><span>${grand.toFixed(2)}</span></div>
          </div>

          <button className="cta" style={{ marginTop: 16 }} onClick={checkout}>
            Proceed to checkout · ${grand.toFixed(2)}
          </button>
        </>
      )}
    </div>
  );
}

/* -------------------------------- Checkout -------------------------------- */
export function Checkout({ go, theme, setTheme }) {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("Cash on Delivery");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const delivery = items.length ? DELIVERY_FEE : 0;
  const grand = Math.round((total + delivery) * 100) / 100;

  async function place() {
    if (!address.trim() || items.length === 0) return;
    setErr("");
    setBusy(true);
    try {
      await api.createOrder({
        items: items.map((x) => ({ food_id: x.food.id, qty: x.qty })),
        address,
        payment,
      });
      clear();
      go("orders");
    } catch (e) {
      setErr(e.message || "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="page">
        <div className="page-head">
          <button className="icon-btn" onClick={() => go("cart")}><ArrowLeft size={19} /></button>
          <h1>Checkout</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <div className="empty"><div className="big">🔒</div><h3>Please sign in</h3><p>You need an account to place an order.</p><button className="cta inline" onClick={() => go("auth", { next: "checkout" })}>Sign in</button></div>
      </div>
    );
  }

  const options = [
    { id: "Cash on Delivery", icon: Wallet },
    { id: "Card", icon: CreditCard },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => go("cart")}><ArrowLeft size={19} /></button>
        <h1>Checkout</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      {err && <div className="err">{err}</div>}

      <h3 style={{ fontFamily: "var(--font-display)", margin: "4px 2px 12px", fontSize: 16 }}>Delivery address</h3>
      <div className="field">
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, street, area, city…" />
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", margin: "10px 2px 12px", fontSize: 16 }}>Payment method</h3>
      {options.map((o) => {
        const I = o.icon;
        return (
          <div key={o.id} className={"opt" + (payment === o.id ? " on" : "")} onClick={() => setPayment(o.id)}>
            <I size={18} /> {o.id}
            <span className="tick">{payment === o.id && <Check size={12} />}</span>
          </div>
        );
      })}

      <div className="summary glass" style={{ marginTop: 14 }}>
        <div className="sumrow"><span>Items ({items.length})</span><span>${total.toFixed(2)}</span></div>
        <div className="sumrow"><span>Delivery fee</span><span>${delivery.toFixed(2)}</span></div>
        <div className="sumrow total"><span>Total</span><span>${grand.toFixed(2)}</span></div>
      </div>

      <button className="cta" style={{ marginTop: 16 }} onClick={place} disabled={busy || !address.trim() || items.length === 0}>
        {busy ? "Placing order…" : `Place order · $${grand.toFixed(2)}`}
      </button>
    </div>
  );
}

/* --------------------------------- Orders --------------------------------- */
export function Orders({ go, theme, setTheme }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    api.orders().then(setOrders).catch((e) => setErr(e.message));
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <div className="page-head"><h1>Orders</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="empty"><div className="big">🧾</div><h3>Sign in to see orders</h3><p>Your order history lives in your account.</p><button className="cta inline" onClick={() => go("auth", { next: "orders" })}>Sign in</button></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head"><h1>Your Orders</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
      {err && <div className="err">{err}</div>}
      {orders === null ? (
        <div className="loading">Loading your orders…</div>
      ) : orders.length === 0 ? (
        <div className="empty"><div className="big">🍽️</div><h3>No orders yet</h3><p>Place your first order from the menu.</p><button className="cta inline" onClick={() => go("home")}>Browse menu</button></div>
      ) : (
        orders.map((o) => (
          <div className="order-card glass" key={o.id}>
            <div className="order-top">
              <span className="oid">Order #{o.id}</span>
              <span className="badge-status">{o.status}</span>
            </div>
            {o.items.map((it) => (
              <div className="order-line" key={it.id}>
                <span>{it.qty} × {it.name}</span>
                <span>${(it.price * it.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="order-foot"><span>Total</span><span>${o.total.toFixed(2)}</span></div>
            <div className="order-date" style={{ marginTop: 6 }}>{new Date(o.created_at).toLocaleString()} · {o.payment}</div>
          </div>
        ))
      )}
    </div>
  );
}

/* --------------------------------- Profile -------------------------------- */
export function Profile({ go, theme, setTheme }) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="page">
        <div className="page-head"><h1>Profile</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="empty"><div className="big">👤</div><h3>Welcome to BiteRush</h3><p>Sign in to manage your orders and account.</p><button className="cta inline" onClick={() => go("auth", { next: "profile" })}>Sign in</button></div>
      </div>
    );
  }

  const initial = (user.name || "U").trim().charAt(0).toUpperCase();
  const items = [
    { icon: Receipt, label: "My Orders", action: () => go("orders") },
    { icon: Heart, label: "My Favorites" },
    { icon: CreditCard, label: "Payment Methods" },
    { icon: Pin, label: "Addresses" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="page">
      <div className="page-head"><h1>Profile</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
      <div className="profile-head">
        <div className="avatar">{initial}</div>
        <h2>{user.name}</h2>
        <div className="em2">{user.email}</div>
      </div>
      {items.map((it) => {
        const I = it.icon;
        return (
          <div className="menu-item glass" key={it.label} onClick={it.action || (() => {})}>
            <span className="lead"><I size={19} /></span>
            {it.label}
            <ChevronRight className="chev" size={18} />
          </div>
        );
      })}
      <div className="menu-item glass danger" onClick={() => { logout(); go("home"); }}>
        <span className="lead"><LogOut size={19} /></span>
        Log out
      </div>
    </div>
  );
}
