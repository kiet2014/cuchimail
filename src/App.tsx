import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* ================= LANGUAGE ================= */
const LANG = {
  vi: {
    inbox: "Hộp thư đến",
    sent: "Đã gửi",
    compose: "Soạn thư",
    search: "Tìm email...",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    send: "Gửi",
    cancel: "Hủy",
    login: "Đăng nhập",
    register: "Đăng ký",
    switchLogin: "Đã có tài khoản? Đăng nhập",
    switchRegister: "Chưa có tài khoản? Đăng ký",
  },
  en: {
    inbox: "Inbox",
    sent: "Sent",
    compose: "Compose",
    search: "Search mail...",
    settings: "Settings",
    logout: "Logout",
    language: "Language",
    theme: "Theme",
    send: "Send",
    cancel: "Cancel",
    login: "Login",
    register: "Register",
    switchLogin: "Already have an account? Login",
    switchRegister: "Create new account",
  },
};

/* ================= THEMES ================= */
const THEMES: Record<string, Record<string, string>> = {
  blue: { "--primary": "#6366f1", "--bg-app": "#f1f5f9" },
  green: { "--primary": "#22c55e", "--bg-app": "#f0fdf4" },
  brown: { "--primary": "#92400e", "--bg-app": "#fef3c7" },
  dark: { "--primary": "#38bdf8", "--bg-app": "#020617" },
  galaxy: {
    "--primary": "#60a5fa",
    "--bg-app": "radial-gradient(circle at 20% 20%, #0f172a, #020617)",
  },
};

interface Mail {
  id: number;
  sender_email: string;
  recipient_email: string;
  subject: string;
  body: string;
  created_at: string;
}

/* ================= AUTH ================= */
function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const { error } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
  };

  return (
    <div
      className="glass slide-up"
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 360 }}>
        <h2 style={{ textAlign: "center" }}>CuchiMail</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ color: "red", fontSize: 13, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <button style={{ width: "100%" }} onClick={submit}>
          {isRegister ? "Register" : "Login"}
        </button>

        <span onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "← Login" : "Create account"}
        </span>
      </div>
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] =
    useState<"inbox" | "sent" | "compose" | "settings">("inbox");
  const [mails, setMails] = useState<Mail[]>([]);
  const [current, setCurrent] = useState<Mail | null>(null);
  const [search, setSearch] = useState("");

  const [lang, setLang] = useState<keyof typeof LANG>(
    () => (localStorage.getItem("lang") as any) || "vi"
  );
  const t = LANG[lang];

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "blue"
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  useEffect(() => {
    Object.entries(THEMES[theme]).forEach(([k, v]) =>
      document.documentElement.style.setProperty(k, v)
    );
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

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
    <div
      key={theme + lang}
      className="fade"
      style={{ display: "flex", height: "100vh" }}
    >
      {/* SIDEBAR */}
      <aside className="glass" style={{ width: 260, padding: 20, margin: 12 }}>
        <h3>CuchiMail</h3>
        <div onClick={() => setView("inbox")}>{t.inbox}</div>
        <div onClick={() => setView("sent")}>{t.sent}</div>
        <div onClick={() => setView("compose")}>{t.compose}</div>
        <div onClick={() => setView("settings")}>{t.settings}</div>

        <div style={{ marginTop: "auto" }}>
          <button
            style={{ background: "none", color: "red" }}
            onClick={() => supabase.auth.signOut()}
          >
            {t.logout}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {view !== "compose" && view !== "settings" && (
          <input
            placeholder={`🔍 ${t.search}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {(view === "inbox" || view === "sent") &&
          mails
            .filter((m) =>
              view === "sent"
                ? m.sender_email === session.user.email
                : m.recipient_email === session.user.email
            )
            .filter(
              (m) =>
                m.sender_email.toLowerCase().includes(search.toLowerCase()) ||
                m.subject.toLowerCase().includes(search.toLowerCase()) ||
                m.body.toLowerCase().includes(search.toLowerCase())
            )
            .map((m) => (
              <div
                key={m.id}
                className="mail-card"
                onClick={() => setCurrent(m)}
              >
                <b>{m.sender_email}</b>
                <div>{m.subject}</div>
              </div>
            ))}

        {current && (
          <div className="glass slide-up" style={{ padding: 20 }}>
            <h3>{current.subject}</h3>
            <p>{current.body}</p>
            <button onClick={() => setCurrent(null)}>← Back</button>
          </div>
        )}

        {view === "compose" && (
          <Compose
            user={session.user.email}
            onDone={() => setView("inbox")}
            t={t}
          />
        )}

        {view === "settings" && (
          <div className="glass slide-up" style={{ padding: 20 }}>
            <b>{t.language}</b>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇺🇸 English</option>
            </select>

            <b style={{ display: "block", marginTop: 16 }}>{t.theme}</b>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 10,
              }}
            >
              {Object.keys(THEMES).map((k) => (
                <div
                  key={k}
                  onClick={() => setTheme(k)}
                  style={{
                    height: 40,
                    borderRadius: 12,
                    cursor: "pointer",
                    border:
                      theme === k
                        ? "3px solid var(--primary)"
                        : "2px solid #e5e7eb",
                    background:
                      k === "galaxy"
                        ? THEMES[k]["--bg-app"]
                        : THEMES[k]["--primary"],
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= COMPOSE ================= */
function Compose({
  user,
  onDone,
  t,
}: {
  user: string;
  onDone: () => void;
  t: any;
}) {
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
      <input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
      <input
        placeholder="Subject"
        value={sub}
        onChange={(e) => setSub(e.target.value)}
      />
      <textarea
        rows={6}
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button onClick={send}>{t.send}</button>
      <button
        style={{ marginLeft: 10, background: "#e5e7eb", color: "#334155" }}
        onClick={onDone}
      >
        {t.cancel}
      </button>
    </div>
  );
}
