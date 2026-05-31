import { useState, useEffect } from "react";
import { Backdrop, BottomNav } from "./components.jsx";
import { Auth, Home, FoodDetail, Cart, Checkout, Orders, Profile, Search } from "./screens.jsx";
import { AdminDashboard, OwnerDashboard, DeliveryBoyDashboard } from "./dashboards.jsx";
import { api } from "./api.js";
import { FOODS_FALLBACK, CATEGORIES_FALLBACK } from "./data.js";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user } = useAuth();
  const [theme, setTheme] = useState("dark");
  const [nav, setNav] = useState({ screen: "home" });
  const [foods, setFoods] = useState(FOODS_FALLBACK);
  const [categories, setCategories] = useState(CATEGORIES_FALLBACK);

  const go = (screen, extra = {}) => { setNav({ screen, ...extra }); window.scrollTo({ top: 0 }); };
  const onNav = (id) => go(id);

  useEffect(() => {
    api.foods().then((d) => { if (Array.isArray(d) && d.length) setFoods(d); }).catch(() => {});
    api.categories().then((d) => { if (Array.isArray(d) && d.length) setCategories(d); }).catch(() => {});
  }, []);

  const selectedFood = nav.foodId != null ? foods.find((f) => f.id === nav.foodId) : null;
  const showNav = ["home", "cart", "orders", "profile", "search"].includes(nav.screen);

  let screen;
  if (nav.screen === "auth") {
    screen = <Auth theme={theme} setTheme={setTheme} onBack={() => go("home")} onDone={() => go(nav.next || "home")} />;
  } else if (nav.screen === "admin-dashboard") {
    screen = <AdminDashboard go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "owner-dashboard") {
    screen = <OwnerDashboard go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "delivery-dashboard") {
    screen = <DeliveryBoyDashboard go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "detail" && selectedFood) {
    screen = <FoodDetail food={selectedFood} theme={theme} setTheme={setTheme} onBack={() => go("home")} />;
  } else if (nav.screen === "cart") {
    screen = <Cart go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "checkout") {
    screen = <Checkout go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "orders") {
    screen = <Orders go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "profile") {
    screen = <Profile go={go} theme={theme} setTheme={setTheme} />;
  } else if (nav.screen === "search") {
    screen = <Search go={go} theme={theme} setTheme={setTheme} />;
  } else {
    screen = <Home foods={foods} categories={categories} onOpen={(f) => go("detail", { foodId: f.id })} theme={theme} setTheme={setTheme} go={go} />;
  }

  return (
    <div className="app" data-theme={theme}>
      <Backdrop />
      {screen}
      {showNav && <BottomNav active={nav.screen} onNav={onNav} />}
    </div>
  );
}
