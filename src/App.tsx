import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* ================= LANGUAGE ================= */
const LANG = {
  vi: {
    inbox: "Hộp thư đến",
    sent: "Đã gửi",
    compose: "Soạn thư",
    settings: "Cài đặt",
    search: "Tìm email...",
    logout: "Đăng xuất",
    login: "Đăng nhập",
    register: "Đăng ký",
    send: "Gửi",
    cancel: "Hủy",
    language: "Ngôn ngữ",
    theme: "Giao diện",
  },
  en: {
    inbox: "Inbox",
    sent: "Sent",
    compose: "Compose",
    settings: "Settings",
    search: "Search mail...",
    logout: "Logout",
    login: "Login",
    register: "Register",
    send: "Send",
    cancel: "Cancel",
    language: "Language",
    theme: "Theme",
  },
};

/* ================= THEMES ================= */
const THEMES: Record<string, Record<string, string>> = {
  blue: { "--primary": "#6366f1", "--bg-app": "#f1f5f9" },
  green: { "--primary": "#22c55e", "--bg-app": "#f0fdf4" },
  dark: { "--primary": "#38bdf8", "--bg-app": "#020617" },
};

/* ================= AUTH ================= */
function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const { error } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
  };

  return (
    <div className="glass slide-up" style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ width: 320 }}>
        <h2 style={{ textAlign: "center" }}>CuchiMail</h2>

        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />

        {error && <div style={{ color: "red", fontSize: 13 }}>{error}</div>}

        <button style={{ width: "100%" }} onClick={submit}>
          {isRegister ? "Register" : "Login"}
        </button>

        <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "← Login" : "Create account"}
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<"inbox" | "sent" | "compose" | "settings">("inbox");
  const [mails, setMails] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [lang, setLang] = useState<"vi" | "en">(
    () => (localStorage.getItem("lang") as any) || "vi"
  );
  const t = LANG[lang];

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "blue");

  /* ===== AUTH FIX (QUAN TRỌNG) ===== */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ===== THEME ===== */
  useEffect(() => {
    Object.entries(THEMES[theme]).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v)
    );
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  /* ===== LOAD MAIL ===== */
  useEffect(() => {
    if (!session) return;
    supabase
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMails(data || []));
  }, [session]);

  if (!session) return <Auth />;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* SIDEBAR */}
      <aside className="glass" style={{ width: 240, padding: 16, margin: 12 }}>
        <h3>CuchiMail</h3>
        <div onClick={() => setView("inbox")}>{t.inbox}</div>
        <div onClick={() => setView("sent")}>{t.sent}</div>
        <div onClick={() => setView("compose")}>{t.compose}</div>
        <div onClick={() => setView("settings")}>{t.settings}</div>

        <button
          style={{ marginTop: "auto", color: "red" }}
          onClick={async () => {
            await supabase.auth.signOut();
            setSession(null); // 🔥 FIX
          }}
        >
          {t.logout}
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {view !== "compose" && view !== "settings" && (
          <input
            placeholder={t.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}

        {(view === "inbox" || view === "sent") &&
          mails
            .filter(m =>
              view === "sent"
                ? m.sender_email === session.user.email
                : m.recipient_email === session.user.email
            )
            .filter(
              m =>
                m.subject.toLowerCase().includes(search.toLowerCase()) ||
                m.body.toLowerCase().includes(search.toLowerCase())
            )
            .map(m => (
              <div key={m.id} className="mail-card">
                <b>{m.sender_email}</b>
                <div>{m.subject}</div>
              </div>
            ))}

        {view === "compose" && <Compose user={session.user.email} t={t} onDone={() => setView("inbox")} />}

        {view === "settings" && (
          <div className="glass slide-up" style={{ padding: 20 }}>
            <b>{t.language}</b>
            <select value={lang} onChange={e => setLang(e.target.value as any)}>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇺🇸 English</option>
            </select>

            <b style={{ display: "block", marginTop: 16 }}>{t.theme}</b>
            {Object.keys(THEMES).map(k => (
              <button key={k} onClick={() => setTheme(k)}>
                {k}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= COMPOSE ================= */
function Compose({ user, onDone, t }: any) {
  const [to, setTo] = useState("");
  const [sub, setSub] = useState("");
  const [body, setBody] = useState("");

  const send = async () => {
    await supabase.from("emails").insert({
      sender_email: user,
      recipient_email: to,
      subject: sub,
      body,
    });
    onDone();
  };

  return (
    <div className="glass slide-up" style={{ padding: 20 }}>
      <input placeholder="To" value={to} onChange={e => setTo(e.target.value)} />
      <input placeholder="Subject" value={sub} onChange={e => setSub(e.target.value)} />
      <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} />
      <button onClick={send}>{t.send}</button>
      <button onClick={onDone}>{t.cancel}</button>
    </div>
  );
}
