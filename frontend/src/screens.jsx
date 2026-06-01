import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon, Bell, MapPin, ChevronDown, Filter, Flame, Star, Clock,
  Navigation, ArrowLeft, Plus, Minus, Check, ShoppingBag, Receipt, Heart,
  CreditCard, Wallet, MapPin as Pin, Settings, LogOut, ChevronRight, User,
  ChevronLeft, CheckCircle, Gift, Truck, Zap, TrendingUp, Sandwich, UtensilsCrossed, Cookie, CupSoda, Pizza,
  MessageCircle, Eye, MapPinIcon, Phone, Share2, Smartphone, ShieldCheck, LocateFixed, Send,
} from "lucide-react";
import { ThemeToggle, HeroCarousel, FoodCard, Dish } from "./components.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useCart } from "./context/CartContext.jsx";
import { api } from "./api.js";
import { RESTAURANTS } from "./data.js";
import { OrderChat } from "./OrderChat.jsx";
import { LocationMap } from "./LocationMap.jsx";

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
      const u = mode === "login"
        ? await login(email, password)
        : await register(name, email, password, role);
      onDone(u);
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <header className="header" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <button className="icon-btn" onClick={onBack} style={{ cursor: "pointer" }}><ArrowLeft size={19} /></button>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      <div className="auth-card glass">
        <div className="brand">Bite<span>Rush</span></div>
        <div className="sub">Crave it. Tap it. Get it.</div>

        <div className="seg">
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErr(""); }}>Log in</button>
          <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setErr(""); }}>Sign up</button>
        </div>

        {err && <div className="err">{err}</div>}

        {mode === "login" ? (
          <>
            <p className="auth-form-caption">Welcome back! Sign in to your account.</p>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 4 characters" />
            </div>
          </>
        ) : (
          <>
            <p className="auth-form-caption">Create your BiteRush account and start ordering faster.</p>
            <div className="field">
              <label>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 4 characters" />
            </div>
            <div className="field">
              <label>Your role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="customer">👤 Customer - Order food</option>
                <option value="owner">🏪 Restaurant Owner - Manage a menu</option>
                <option value="delivery_rider">🚴 Delivery Rider - Deliver orders</option>
              </select>
            </div>
          </>
        )}

        <button className="cta" onClick={submit} disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        <div className="muted-note">Your account is secure. We protect your data with industry-standard encryption.</div>
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
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewErr, setReviewErr] = useState("");

  useEffect(() => {
    api.reviews({ food: food.id }).then(setReviews).catch(() => setReviews([]));
  }, [food.id]);

  function addToCart() {
    add(food, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  }

  async function submitReview() {
    setReviewErr("");
    setReviewBusy(true);
    try {
      await api.createReview({ food_id: food.id, rating: myRating, comment: myComment });
      setMyComment("");
      setMyRating(5);
      setReviews(await api.reviews({ food: food.id }));
    } catch (e) {
      setReviewErr(e.message || "Could not submit review");
    } finally {
      setReviewBusy(false);
    }
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

          <h3 style={{ marginTop: 22 }}>Reviews {reviews.length > 0 && <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 14 }}>({reviews.length})</span>}</h3>

          {user ? (
            <div className="glass" style={{ padding: 14, borderRadius: 18, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setMyRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: n <= myRating ? "var(--star)" : "var(--muted)" }}>
                    <Star size={22} fill={n <= myRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <div className="field" style={{ marginBottom: 10 }}>
                <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Share your thoughts on this dish…" />
              </div>
              {reviewErr && <div className="err" style={{ marginBottom: 10 }}>{reviewErr}</div>}
              <button className="cta" onClick={submitReview} disabled={reviewBusy}>{reviewBusy ? "Posting…" : "Post review"}</button>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>Sign in to leave a review.</p>
          )}

          {reviews.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No reviews yet — be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="glass" style={{ padding: 12, borderRadius: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{r.user_name || "User"}</strong>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--star)", fontSize: 13, fontWeight: 700 }}>
                    <Star size={14} fill="currentColor" /> {r.rating}
                  </span>
                </div>
                {r.comment && <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{r.comment}</p>}
              </div>
            ))
          )}
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

/* card helpers (client-side only — PAN/CVV never leave the browser) */
function luhnOk(num) {
  const s = (num || "").replace(/\D/g, "");
  if (s.length < 13) return false;
  let sum = 0, alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = +s[i];
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}
function cardNetwork(num) {
  const n = (num || "").replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "Card";
}
const randHex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n))).map((b) => b.toString(16).padStart(2, "0")).join("");

/* -------------------------------- Checkout -------------------------------- */
export function Checkout({ go, theme, setTheme }) {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("Cash on Delivery");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(null); // { code, discount }
  const [promoErr, setPromoErr] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvv: "", name: "" });
  const [wallet, setWallet] = useState({ phone: "", pin: "" });
  const [idemKey] = useState(() => "idem_" + randHex(12)); // one per checkout — prevents double-charge

  const delivery = items.length ? DELIVERY_FEE : 0;
  const discount = applied?.discount || 0;
  const grand = Math.round((total + delivery - discount) * 100) / 100;

  async function applyPromo() {
    setPromoErr("");
    if (!promo.trim()) return;
    try {
      const r = await api.validatePromo({ code: promo.trim(), subtotal: total });
      setApplied({ code: r.code, discount: r.discount });
    } catch (e) {
      setApplied(null);
      setPromoErr(e.message || "Invalid code");
    }
  }

  function validatePayment() {
    if (payment === "Card") {
      if (!luhnOk(card.number)) return "Enter a valid card number.";
      const m = card.exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
      if (!m) return "Expiry must be in MM/YY format.";
      const mo = +m[1], yr = 2000 + +m[2], now = new Date();
      if (mo < 1 || mo > 12) return "Invalid expiry month.";
      if (new Date(yr, mo, 1) <= new Date(now.getFullYear(), now.getMonth(), 1)) return "This card has expired.";
      if (!/^\d{3,4}$/.test(card.cvv)) return "Invalid CVV.";
      if (!card.name.trim()) return "Enter the name on the card.";
    }
    if (payment === "JazzCash" || payment === "EasyPaisa") {
      const digits = wallet.phone.replace(/\D/g, "");
      if (digits.length !== 11 || !digits.startsWith("03")) return "Enter a valid mobile number (03XXXXXXXXX).";
      if (!/^\d{4,6}$/.test(wallet.pin)) return `Enter your ${payment} MPIN.`;
    }
    return "";
  }

  // Build the data sent to the server. The card PAN and the CVV/PIN are NEVER
  // included — only a random token, the last 4 digits, or the wallet number.
  function buildPaymentDetails() {
    if (payment === "Card") {
      const num = card.number.replace(/\D/g, "");
      return { token: "tok_" + randHex(16), last4: num.slice(-4), network: cardNetwork(num) };
    }
    if (payment === "JazzCash" || payment === "EasyPaisa") {
      return { wallet: wallet.phone.replace(/\D/g, "") };
    }
    return {};
  }

  async function place() {
    if (!address.trim() || items.length === 0) return;
    const v = validatePayment();
    if (v) { setErr(v); return; }
    setErr("");
    setBusy(true);
    try {
      await api.createOrder({
        items: items.map((x) => ({ food_id: x.food.id, qty: x.qty })),
        address,
        payment,
        promo_code: applied?.code || "",
        payment_details: buildPaymentDetails(),
        idempotency_key: idemKey,
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

  if (user.role !== "customer") {
    return (
      <div className="page">
        <div className="page-head">
          <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
          <h1>Checkout</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <div className="empty"><div className="big">🛍️</div><h3>Customer accounts only</h3><p>Placing orders is available to customer accounts. Owner, rider, and admin accounts manage the platform rather than order food.</p><button className="cta inline" onClick={() => go("home")}>Back to home</button></div>
      </div>
    );
  }

  const options = [
    { id: "Cash on Delivery", icon: Wallet, sub: "Pay with cash on arrival" },
    { id: "Card", icon: CreditCard, sub: "Visa · Mastercard" },
    { id: "JazzCash", icon: Smartphone, sub: "Mobile wallet" },
    { id: "EasyPaisa", icon: Smartphone, sub: "Mobile wallet" },
  ];
  const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

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
            <I size={18} />
            <span style={{ flex: 1 }}>{o.id}<small style={{ display: "block", color: "var(--muted)", fontWeight: 500, fontSize: 11 }}>{o.sub}</small></span>
            <span className="tick">{payment === o.id && <Check size={12} />}</span>
          </div>
        );
      })}

      {payment === "Card" && (
        <div className="glass pay-form">
          <div className="field">
            <label>Card number</label>
            <input inputMode="numeric" autoComplete="cc-number" value={card.number}
              onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} placeholder="4242 4242 4242 4242" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Expiry</label>
              <input inputMode="numeric" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} placeholder="MM/YY" />
            </div>
            <div className="field" style={{ width: 110 }}>
              <label>CVV</label>
              <input type="password" inputMode="numeric" value={card.cvv} maxLength={4}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="•••" />
            </div>
          </div>
          <div className="field">
            <label>Name on card</label>
            <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Full name" />
          </div>
        </div>
      )}

      {(payment === "JazzCash" || payment === "EasyPaisa") && (
        <div className="glass pay-form">
          <div className="field">
            <label>{payment} mobile number</label>
            <input inputMode="numeric" value={wallet.phone}
              onChange={(e) => setWallet({ ...wallet, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="03XXXXXXXXX" />
          </div>
          <div className="field">
            <label>MPIN</label>
            <input type="password" inputMode="numeric" value={wallet.pin} maxLength={6}
              onChange={(e) => setWallet({ ...wallet, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="••••" />
          </div>
        </div>
      )}

      {payment !== "Cash on Delivery" && (
        <div className="pay-secure"><ShieldCheck size={14} /> Secured — your details are encrypted in your browser; we never store your card number, CVV, or PIN.</div>
      )}

      <h3 style={{ fontFamily: "var(--font-display)", margin: "16px 2px 10px", fontSize: 16 }}>Promo code</h3>
      <div className="promo-row">
        <input className="dash-input" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="e.g. WELCOME10" disabled={!!applied} />
        {applied
          ? <button className="profile-cta-secondary" style={{ width: "auto", padding: "10px 16px" }} onClick={() => { setApplied(null); setPromo(""); }}>Remove</button>
          : <button className="cta" style={{ width: "auto", padding: "10px 18px" }} onClick={applyPromo}>Apply</button>}
      </div>
      {promoErr && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{promoErr}</div>}
      {applied && <div className="promo-applied"><Check size={14} /> Code {applied.code} applied · −${applied.discount.toFixed(2)}</div>}

      <div className="summary glass" style={{ marginTop: 14 }}>
        <div className="sumrow"><span>Items ({items.length})</span><span>${total.toFixed(2)}</span></div>
        <div className="sumrow"><span>Delivery fee</span><span>${delivery.toFixed(2)}</span></div>
        {discount > 0 && <div className="sumrow" style={{ color: "var(--accent-ink)" }}><span>Discount ({applied.code})</span><span>−${discount.toFixed(2)}</span></div>}
        <div className="sumrow total"><span>Total</span><span>${grand.toFixed(2)}</span></div>
      </div>

      <button className="cta" style={{ marginTop: 16 }} onClick={place} disabled={busy || !address.trim() || items.length === 0}>
        {busy ? "Processing payment…" : payment === "Cash on Delivery" ? `Place order · $${grand.toFixed(2)}` : `Pay $${grand.toFixed(2)}`}
      </button>
    </div>
  );
}

/* Simulated order-status timeline */
const ORDER_STEPS = [
  { key: "PLACED", label: "Order placed" },
  { key: "PREPARING", label: "Preparing your food" },
  { key: "READY", label: "Ready for pickup" },
  { key: "ON_THE_WAY", label: "On the way" },
  { key: "DELIVERED", label: "Delivered" },
];
function OrderTimeline({ status }) {
  if (status === "CANCELLED")
    return <div className="badge-status" style={{ background: "rgba(239,68,68,.15)", color: "#ef4444" }}>Cancelled</div>;
  const current = Math.max(0, ORDER_STEPS.findIndex((s) => s.key === status));
  return (
    <div className="timeline">
      {ORDER_STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <div key={s.key} className={"tl-step" + (done ? " done" : "") + (i === current ? " current" : "")}>
            <div className="tl-dot">{done ? <Check size={13} /> : null}</div>
            <div className="tl-label">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Orders --------------------------------- */
export function Orders({ go, theme, setTheme }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState("");
  const [chatOrder, setChatOrder] = useState(null);

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

  // Only the most-recent still-in-progress order shows the live tracking timeline.
  const activeId = Array.isArray(orders)
    ? orders.find((o) => !["DELIVERED", "CANCELLED"].includes(o.status))?.id
    : null;

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
              <span className="oid">Order #{String(o.id).slice(-6)}</span>
              <span className="badge-status">{(o.status || "").replace(/_/g, " ")}</span>
            </div>
            {o.items.map((it, idx) => (
              <div className="order-line" key={idx}>
                <span>{it.qty} × {it.name}</span>
                <span>${(it.price * it.qty).toFixed(2)}</span>
              </div>
            ))}
            {o.discount > 0 && (
              <div className="order-line" style={{ color: "var(--accent-ink)" }}>
                <span>Promo {o.promo_code}</span>
                <span>−${o.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="order-foot"><span>Total</span><span>${o.total.toFixed(2)}</span></div>
            {o.id === activeId && <OrderTimeline status={o.status} />}
            <div className="order-date" style={{ marginTop: 10 }}>{new Date(o.created_at).toLocaleString()} · {o.payment}</div>
            <button className="order-chat-btn" onClick={() => setChatOrder(o.id)}>
              <MessageCircle size={16} /> Chat with restaurant
            </button>
          </div>
        ))
      )}
      {chatOrder && <OrderChat orderId={chatOrder} onClose={() => setChatOrder(null)} />}
    </div>
  );
}


/* -------------------------------- Search -------------------------------- */
function distKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function Search({ go, theme, setTheme }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState(null);
  const [selected, setSelected] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [nearest, setNearest] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.restaurants().then(setRestaurants).catch((e) => { setErr(e.message); setRestaurants([]); });
  }, []);

  const findNearest = () => {
    if (!navigator.geolocation) { setErr("Geolocation isn't supported on this device."); return; }
    setLocating(true); setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearest(true); setLocating(false); },
      (e) => { setErr(e.code === 1 ? "Location permission denied." : "Couldn't get your location."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  let list = (restaurants || []).map((r) => ({ ...r, dist: distKm(userLoc, r) }));
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((r) => r.name.toLowerCase().includes(q) || (r.cuisine || "").toLowerCase().includes(q));
  }
  if (nearest && userLoc) list = [...list].sort((a, b) => (a.dist ?? 9e9) - (b.dist ?? 9e9));

  return (
    <div className="container">
      <header className="header">
        <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={20} /></button>
        <h2 style={{ flex: 1, textAlign: "center" }}>Search Restaurants</h2>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>

      {selected ? (
        <RestaurantDetail restaurant={selected} userLoc={userLoc} user={user} onBack={() => setSelected(null)} go={go} />
      ) : (
        <>
          <div className="search glass" style={{ marginTop: 18 }}>
            <SearchIcon size={19} color="var(--muted)" />
            <input placeholder="Search restaurants or cuisines…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className={"chip" + (nearest ? " on" : "")} onClick={findNearest} disabled={locating}>
              <LocateFixed size={14} /> {locating ? "Locating…" : "Nearest to me"}
            </button>
            {nearest && <button className="chip" onClick={() => setNearest(false)}>Clear</button>}
          </div>

          {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}

          <div className="search-results" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {restaurants === null ? (
              <div className="loading">Loading restaurants…</div>
            ) : list.length === 0 ? (
              <div className="empty" style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <h3>No restaurants found</h3>
                <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Try a different name or cuisine</p>
              </div>
            ) : (
              list.map((r) => (
                <div key={r.id} className="glass restaurant-row" onClick={() => setSelected(r)}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 42 }}>{r.image}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>{r.name}</h4>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{r.cuisine}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, flexWrap: "wrap" }}>
                        <span><Star size={12} fill="var(--primary)" color="var(--primary)" /> {r.rating}</span>
                        <span><Clock size={12} /> {r.time}</span>
                        {r.dist != null && <span style={{ color: "var(--accent-ink)", fontWeight: 700 }}><MapPin size={12} /> {r.dist.toFixed(1)} km</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--primary)" />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RestaurantDetail({ restaurant, userLoc, user, onBack, go }) {
  const [reviews, setReviews] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const dist = distKm(userLoc, restaurant);

  const load = () => api.reviews({ restaurant: restaurant.id }).then(setReviews).catch(() => setReviews([]));
  useEffect(() => { load(); }, [restaurant.id]);

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      await api.createReview({ restaurant_id: restaurant.id, rating, comment });
      setComment(""); setRating(5);
      await load();
    } catch (e) { setErr(e.message || "Couldn't post review"); }
    finally { setBusy(false); }
  };

  return (
    <div className="restaurant-detail glass" style={{ marginTop: 18, padding: 20, borderRadius: 22 }}>
      <button className="icon-btn" onClick={onBack} style={{ marginBottom: 12 }}><ArrowLeft size={18} /></button>
      <div style={{ fontSize: 46, marginBottom: 8 }}>{restaurant.image}</div>
      <h2 style={{ marginBottom: 4 }}>{restaurant.name}</h2>
      <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>{restaurant.cuisine}</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 13, flexWrap: "wrap" }}>
        <span><Star size={14} fill="var(--primary)" color="var(--primary)" /> {restaurant.rating}</span>
        <span><Clock size={14} /> {restaurant.time}</span>
        {dist != null && <span style={{ color: "var(--accent-ink)", fontWeight: 700 }}><MapPin size={14} /> {dist.toFixed(1)} km away</span>}
      </div>

      {/* Map + route to the restaurant */}
      <LocationMap key={restaurant.id} value={{ lat: restaurant.lat, lng: restaurant.lng }} editing={false} onChange={() => {}} />

      {/* Reviews */}
      <h3 style={{ margin: "20px 0 12px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>
        Reviews {reviews && reviews.length > 0 && <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13 }}>({reviews.length})</span>}
      </h3>

      {user ? (
        <div className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: n <= rating ? "var(--star)" : "var(--muted)" }}>
                <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`Share your experience at ${restaurant.name}…`} />
          </div>
          {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}
          <button className="cta" onClick={submit} disabled={busy}><Send size={16} /> {busy ? "Posting…" : "Post review"}</button>
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
          <span className="profile-cta-link" onClick={() => go("auth", { next: "search" })} style={{ cursor: "pointer" }}>Sign in</span> to leave a review.
        </p>
      )}

      {reviews === null ? (
        <div className="loading">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>No reviews yet — be the first!</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="glass" style={{ padding: 12, borderRadius: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--primary)", color: "var(--btn-text)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800 }}>
                {(r.user_name || "U")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.user_name || "User"}</div>
                <div style={{ display: "flex", gap: 1, color: "var(--star)" }}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill={i < r.rating ? "currentColor" : "none"} />)}
                </div>
              </div>
            </div>
            {r.comment && <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>{r.comment}</div>}
          </div>
        ))
      )}

      <button className="cta" style={{ width: "100%", marginTop: 16 }} onClick={() => go("home")}>
        <Heart size={16} /> Browse the menu
      </button>
    </div>
  );
}
