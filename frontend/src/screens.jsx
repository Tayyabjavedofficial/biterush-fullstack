import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon, Bell, MapPin, ChevronDown, Filter, Flame, Star, Clock,
  Navigation, ArrowLeft, Plus, Minus, Check, ShoppingBag, Receipt, Heart,
  CreditCard, Wallet, MapPin as Pin, Settings, LogOut, ChevronRight, User,
  ChevronLeft, CheckCircle, Gift, Truck, Zap, TrendingUp, Sandwich, UtensilsCrossed, Cookie, CupSoda, Pizza,
  MessageCircle, Eye, MapPinIcon, Phone, Share2,
} from "lucide-react";
import { ThemeToggle, HeroCarousel, FoodCard, Dish } from "./components.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useCart } from "./context/CartContext.jsx";
import { api } from "./api.js";
import { RESTAURANTS } from "./data.js";

const DELIVERY_FEE = 2.99;

const getNotificationIcon = (iconName) => {
  const icons = {
    "check-circle": <CheckCircle size={20} strokeWidth={2} />,
    "gift": <Gift size={20} strokeWidth={2} />,
    "truck": <Truck size={20} strokeWidth={2} />,
    "zap": <Zap size={20} strokeWidth={2} />,
  };
  return icons[iconName] || <Bell size={20} strokeWidth={2} />;
};

const getCategoryIcon = (categoryName) => {
  const icons = {
    "All": <ShoppingBag size={16} strokeWidth={2} />,
    "Burger": <Sandwich size={16} strokeWidth={2} />,
    "Pizza": <Pizza size={16} strokeWidth={2} />,
    "Chicken": <UtensilsCrossed size={16} strokeWidth={2} />,
    "Fries": <Zap size={16} strokeWidth={2} />,
    "Drinks": <CupSoda size={16} strokeWidth={2} />,
    "Dessert": <Cookie size={16} strokeWidth={2} />,
  };
  return icons[categoryName] || <ShoppingBag size={16} strokeWidth={2} />;
};

/* ---------------------------------- Auth ---------------------------------- */
export function Auth({ onDone, onBack, theme, setTheme }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password, role);
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
          <>
            <div className="field">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tayyab Khan" />
            </div>
            <div className="field">
              <label>What's your role?</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '14px' }}>
                <option value="customer">👤 Customer - Order food</option>
                <option value="delivery_rider">🚴 Delivery Rider - Deliver orders</option>
                <option value="admin">👨‍💼 Admin - Manage platform</option>
              </select>
            </div>
          </>
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
export function Home({ foods, categories, onOpen, theme, setTheme, go }) {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [location, setLocation] = useState("Naperville, IL");
  const [filters, setFilters] = useState({ maxPrice: 20, minRating: 0, maxTime: 60 });
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Order Confirmed!", message: "Your order #12345 has been confirmed", time: "2 mins ago", read: false, icon: "check-circle" },
    { id: 2, title: "Special Offer", message: "30% off burgers this week - Limited time!", time: "1 hour ago", read: false, icon: "gift" },
    { id: 3, title: "Delivery Arriving", message: "Your food will arrive in 15 minutes", time: "3 hours ago", read: true, icon: "truck" },
    { id: 4, title: "New Restaurant", message: "Crunch Kitchen just opened near you", time: "1 day ago", read: true, icon: "zap" },
  ]);
  const allCats = [{ id: 0, name: "All", emoji: "🍽️" }, ...categories];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleHeroButtonClick = (action) => {
    if (action === "order") {
      setCat("All");
      setQuery("");
    } else if (action === "explore") {
      setCat("Dessert");
    }
  };

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  let list = cat === "All" ? foods : foods.filter((f) => f.category === cat);
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((f) => f.name.toLowerCase().includes(q) || f.restaurant.toLowerCase().includes(q));
  }

  // Apply filters
  list = list.filter((f) =>
    f.price <= filters.maxPrice &&
    f.rating >= filters.minRating &&
    parseInt(f.time) <= filters.maxTime
  );

  const popular = [...foods].sort((a, b) => b.rating - a.rating).slice(0, 12);

  return (
    <div className="container">
      <header className="header">
        <div className="loc" onClick={() => setShowLocation(true)} style={{ cursor: "pointer" }}>
          <div className="loc-ic"><MapPin size={18} /></div>
          <div className="loc-txt">
            <small>Deliver to</small>
            <span>{location} <ChevronDown size={14} /></span>
          </div>
        </div>
        <div className="h-right">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="dot" />}
          </button>
        </div>
      </header>

      {showLocation && (
        <div className="modal-overlay" onClick={() => setShowLocation(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Select Delivery Location</h2>
              <button onClick={() => setShowLocation(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px" }}>×</button>
            </div>
            <div className="location-options">
              {["Naperville, IL", "Chicago, IL", "Aurora, IL", "Downers Grove, IL", "Wheaton, IL"].map((loc) => (
                <button key={loc} className="location-btn" onClick={() => { setLocation(loc); setShowLocation(false); }}>
                  <MapPin size={16} /> {loc}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Enter custom location" className="location-input glass" onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value) {
                setLocation(e.target.value);
                setShowLocation(false);
              }
            }} />
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="notifications-panel glass">
          <div className="notif-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--text)" }}>×</button>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={"notif-item" + (notif.read ? "" : " unread")}
                  onClick={() => handleNotificationClick(notif.id)}
                >
                  <div className="notif-icon">{getNotificationIcon(notif.icon)}</div>
                  <div className="notif-content">
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-message">{notif.message}</div>
                    <div className="notif-time">{notif.time}</div>
                  </div>
                  {!notif.read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="greet">
        <small>Hey there,</small>
        <h1>What would you like<br />to eat today?</h1>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="search glass" style={{ flex: 1 }}>
          <SearchIcon size={19} color="var(--muted)" />
          <input placeholder="Search for dishes..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="filt" onClick={() => setShowFilter(!showFilter)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, color: "white" }}>
            <Filter size={17} />
          </button>
        </div>
        <button className="icon-btn" onClick={() => go && go("search")} style={{ background: "var(--glass)", border: "1px solid var(--border-soft)", borderRadius: 14, padding: "10px 14px" }}>
          <MapPin size={18} title="Search restaurants" />
        </button>
      </div>

      {showFilter && (
        <div className="filter-panel glass">
          <h3>Filter Results</h3>
          <div className="filter-item">
            <label>Max Price: ${filters.maxPrice}</label>
            <input type="range" min="0" max="20" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: parseFloat(e.target.value) })} />
          </div>
          <div className="filter-item">
            <label>Min Rating: {filters.minRating}</label>
            <input type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })} />
          </div>
          <div className="filter-item">
            <label>Max Delivery Time: {filters.maxTime} min</label>
            <input type="range" min="5" max="60" step="5" value={filters.maxTime} onChange={(e) => setFilters({ ...filters, maxTime: parseInt(e.target.value) })} />
          </div>
          <button className="cta" onClick={() => setShowFilter(false)}>Done</button>
        </div>
      )}

      <HeroCarousel onOrderClick={handleHeroButtonClick} />

      <div className="chips">
        {allCats.map((c) => (
          <div key={c.name} className={"chip" + (cat === c.name ? " on" : "")} onClick={() => setCat(c.name)}>
            {getCategoryIcon(c.name)}{c.name}
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
  const scrollIntervalRef = React.useRef(null);

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
    if (!scrollRef.current) return;

    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
      const walk = (x - startX) * 1.2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
      return;
    }

    // Auto-scroll based on mouse position
    const rect = scrollRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = 80; // pixels from edge to trigger scroll
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    const currentScroll = scrollRef.current.scrollLeft;

    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

    if (x < threshold && currentScroll > 0) {
      // Cursor on left side - scroll left
      scrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = Math.max(0, scrollRef.current.scrollLeft - 8);
          updatePage();
        }
      }, 30);
    } else if (x > rect.width - threshold && currentScroll < maxScroll) {
      // Cursor on right side - scroll right
      scrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = Math.min(maxScroll, scrollRef.current.scrollLeft + 8);
          updatePage();
        }
      }, 30);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updatePage();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
  };

  React.useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

  const totalPages = Math.ceil(foods.length / 3);

  const goToPage = (pageNum) => {
    if (!scrollRef.current) return;
    const cardWidth = 240 + 14;
    scrollRef.current.scrollLeft = pageNum * (cardWidth * 3);
    setPage(pageNum);
  };

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
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {foods.map((f) => (
            <div key={f.id} className="hcard" onClick={() => onOpen(f)} style={{ userSelect: "none" }}>
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
            <span key={i} className={page === i ? "active" : ""} onClick={() => goToPage(i)} style={{ cursor: "pointer" }} />
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
  const scrollIntervalRef = React.useRef(null);

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
    if (!scrollRef.current) return;

    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
      const walk = (x - startX) * 1.2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
      return;
    }

    // Auto-scroll based on mouse position
    const rect = scrollRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = 80;
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    const currentScroll = scrollRef.current.scrollLeft;

    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

    if (x < threshold && currentScroll > 0) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = Math.max(0, scrollRef.current.scrollLeft - 8);
          updatePage();
        }
      }, 30);
    } else if (x > rect.width - threshold && currentScroll < maxScroll) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = Math.min(maxScroll, scrollRef.current.scrollLeft + 8);
          updatePage();
        }
      }, 30);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updatePage();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
  };

  React.useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

  if (foods.length === 0) {
    return <div className="empty"><div className="big">🔎</div><p>No dishes match your search.</p></div>;
  }

  const totalPages = Math.ceil(foods.length / 3);

  const goToPage = (pageNum) => {
    if (!scrollRef.current) return;
    const cardWidth = 158 + 14;
    scrollRef.current.scrollLeft = pageNum * (cardWidth * 3);
    setPage(pageNum);
  };

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
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {foods.map((f, i) => (
            <FoodCard key={f.id} food={f} onOpen={onOpen} delay={i * 60} />
          ))}
        </div>
        <div className="carousel-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={page === i ? "active" : ""} onClick={() => goToPage(i)} style={{ cursor: "pointer" }} />
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


/* -------------------------------- Search -------------------------------- */
export function Search({ go, theme, setTheme }) {
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedRating, setSelectedRating] = useState(0);
  const [filteredRestaurants, setFilteredRestaurants] = useState(RESTAURANTS);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const locations = ["All", "Downtown", "Midtown", "East Side", "West Plaza", "Arts District", "City Center"];

  useEffect(() => {
    let filtered = RESTAURANTS;

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q)
      );
    }

    if (selectedLocation !== "All") {
      filtered = filtered.filter(r => r.location === selectedLocation);
    }

    if (selectedRating > 0) {
      filtered = filtered.filter(r => r.rating >= selectedRating);
    }

    setFilteredRestaurants(filtered);
  }, [query, selectedLocation, selectedRating]);

  return (
    <div className="container">
      <header className="header">
        <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={20} /></button>
        <h2 style={{ flex: 1, textAlign: "center" }}>Search Restaurants</h2>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <div className="search glass" style={{ marginTop: 18 }}>
        <SearchIcon size={19} color="var(--muted)" />
        <input
          placeholder="Search restaurants or cuisines..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="search-filters" style={{ marginTop: 16, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
        {locations.map(loc => (
          <button
            key={loc}
            className={"chip" + (selectedLocation === loc ? " on" : "")}
            onClick={() => setSelectedLocation(loc)}
            style={{ flexShrink: 0 }}
          >
            <MapPin size={14} /> {loc}
          </button>
        ))}
      </div>

      <div className="rating-filter" style={{ marginTop: 14, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
        {[0, 4, 4.5, 4.7].map(rating => (
          <button
            key={rating}
            className={"chip" + (selectedRating === rating ? " on" : "")}
            onClick={() => setSelectedRating(rating)}
            style={{ flexShrink: 0 }}
          >
            <Star size={13} /> {rating === 0 ? "All" : rating + "+"}
          </button>
        ))}
      </div>

      {selectedRestaurant ? (
        <div className="restaurant-detail glass" style={{ marginTop: 20, padding: 20, borderRadius: 20 }}>
          <button className="icon-btn" onClick={() => setSelectedRestaurant(null)} style={{ marginBottom: 10 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{selectedRestaurant.image}</div>
          <h2 style={{ marginBottom: 4 }}>{selectedRestaurant.name}</h2>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>{selectedRestaurant.cuisine}</div>

          <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 13 }}>
            <div><Star size={14} fill="var(--primary)" color="var(--primary)" /> {selectedRestaurant.rating} ({selectedRestaurant.reviews})</div>
            <div><Clock size={14} /> {selectedRestaurant.time}</div>
            <div><MapPin size={14} /> {selectedRestaurant.distance} km</div>
          </div>

          <div style={{ background: "var(--glass-2)", padding: 12, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>📍 {selectedRestaurant.location}</div>
            <div style={{ height: 120, background: "var(--glass)", borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)" }}>
              Map View (Location: {selectedRestaurant.lat}, {selectedRestaurant.lng})
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12, fontFamily: "var(--font-display)", fontWeight: 800 }}>Customer Reviews</h3>
            {selectedRestaurant.testimonials.map((testimonial, idx) => (
              <div key={idx} className="glass" style={{ padding: 12, borderRadius: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", color: "var(--btn-text)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800 }}>
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{testimonial.name}</div>
                    <div style={{ color: "var(--primary)", fontSize: 11 }}>⭐⭐⭐⭐⭐</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>{testimonial.text}</div>
              </div>
            ))}
          </div>

          <button className="cta" style={{ width: "100%", marginTop: 16 }}>
            <Heart size={16} style={{ marginRight: 8 }} /> Order from {selectedRestaurant.name}
          </button>
        </div>
      ) : (
        <div className="search-results" style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {filteredRestaurants.length === 0 ? (
            <div className="empty" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <h3>No restaurants found</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Try searching with different keywords</p>
            </div>
          ) : (
            filteredRestaurants.map(restaurant => (
              <div
                key={restaurant.id}
                className="glass"
                style={{ padding: 14, borderRadius: 16, cursor: "pointer", transition: "all .2s ease" }}
                onClick={() => setSelectedRestaurant(restaurant)}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontSize: 48 }}>{restaurant.image}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>{restaurant.name}</h4>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{restaurant.cuisine}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                      <span><Star size={12} fill="var(--primary)" color="var(--primary)" /> {restaurant.rating}</span>
                      <span><Clock size={12} /> {restaurant.time}</span>
                      <span><MapPin size={12} /> {restaurant.distance}km</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{restaurant.reviews} reviews</div>
                    <ChevronRight size={16} color="var(--primary)" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
