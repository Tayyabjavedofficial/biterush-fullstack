import { useState, useEffect } from "react";
import {
  Search, Bell, MapPin, ChevronDown, SlidersHorizontal, Heart, Plus,
  Home as HomeIcon, ShoppingBag, Receipt, User, Sun, Moon, Star,
  Pizza, Coffee, Croissant, Cookie, Soup, CupSoda, Sandwich, Cherry, Sparkles, Citrus,
} from "lucide-react";
import { HERO_SLIDES } from "./data.js";
import { useCart } from "./context/CartContext.jsx";

export function Dish({ src, emoji }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="em">{emoji}</span>;
  return <img className="ph" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="toggle" role="group" aria-label="Switch theme">
      <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} title="Dark version">
        <Moon size={16} />
      </button>
      <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} title="Light version">
        <Sun size={16} />
      </button>
    </div>
  );
}

const DOODLES = [
  { Icon: Pizza, top: "7%", left: "6%", size: 46, rot: -14 },
  { Icon: Coffee, top: "16%", left: "88%", size: 36, rot: 10 },
  { Icon: Croissant, top: "40%", left: "3%", size: 44, rot: 8 },
  { Icon: Sparkles, top: "12%", left: "46%", size: 26, rot: 0 },
  { Icon: Soup, top: "58%", left: "92%", size: 42, rot: -8 },
  { Icon: Cookie, top: "74%", left: "8%", size: 38, rot: 12 },
  { Icon: CupSoda, top: "86%", left: "84%", size: 38, rot: -12 },
  { Icon: Sandwich, top: "33%", left: "94%", size: 40, rot: 16 },
  { Icon: Cherry, top: "67%", left: "54%", size: 30, rot: -6 },
  { Icon: Citrus, top: "90%", left: "40%", size: 34, rot: 8 },
];

export function Backdrop() {
  return (
    <>
      <div className="backdrop">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
      </div>
      <div className="doodles">
        {DOODLES.map((d, i) => {
          const I = d.Icon;
          return (
            <I key={i} className="doodle" size={d.size} strokeWidth={1.4}
              style={{ top: d.top, left: d.left, transform: `rotate(${d.rot}deg)` }} />
          );
        })}
      </div>
      <div className="noise" />
    </>
  );
}

export function HeroCarousel() {
  const [hero, setHero] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setHero((h) => (h + 1) % HERO_SLIDES.length), 4200);
    return () => clearInterval(id);
  }, [paused]);

  const s = HERO_SLIDES[hero];
  return (
    <div className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="hero-card">
        <div className="hero-inner hero-anim" key={hero}>
          <div className="hero-text">
            <span className="hero-badge">{s.badge}</span>
            <h3>{s.title}</h3>
            <p>{s.caption}</p>
            <button className="hero-btn">{s.cta}</button>
          </div>
          <div className="hero-food"><Dish src={s.img} emoji={s.emoji} /></div>
        </div>
      </div>
      <div className="dots">
        {HERO_SLIDES.map((_, i) => (
          <span key={i} className={i === hero ? "on" : ""} onClick={() => setHero(i)} />
        ))}
      </div>
    </div>
  );
}

export function FoodCard({ food, onOpen, delay }) {
  const [fav, setFav] = useState(false);
  return (
    <div className="fcard glass reveal" style={{ animationDelay: `${delay}ms` }} onClick={() => onOpen(food)}>
      <div className={"fav" + (fav ? " active" : "")} onClick={(e) => { e.stopPropagation(); setFav((f) => !f); }}>
        <Heart size={15} fill={fav ? "#ef4444" : "none"} />
      </div>
      <div className="food-img"><Dish src={food.img} emoji={food.emoji} /></div>
      <h4>{food.name}</h4>
      <div className="rest">{food.restaurant}</div>
      <div className="frow">
        <span className="price">${food.price.toFixed(2)}</span>
        <button className="add" onClick={(e) => { e.stopPropagation(); onOpen(food); }}><Plus size={18} /></button>
      </div>
    </div>
  );
}

export function BottomNav({ active, onNav }) {
  const { count } = useCart();
  const NAV = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "cart", icon: ShoppingBag, label: "Cart" },
    { id: "orders", icon: Receipt, label: "Orders" },
    { id: "profile", icon: User, label: "Profile" },
  ];
  return (
    <nav className="nav glass">
      {NAV.map((n) => {
        const Icon = n.icon;
        const showBadge = n.id === "cart" && count > 0 && active !== "cart";
        return (
          <button key={n.id} className={active === n.id ? "on" : ""} onClick={() => onNav(n.id)}>
            {showBadge ? <span className="badge">{count}</span> : null}
            <Icon size={19} />
            {n.label}
          </button>
        );
      })}
    </nav>
  );
}
