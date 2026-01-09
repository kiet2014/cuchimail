import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Star, Trash2, Settings, LogOut, 
  Search, Plus, Globe, Inbox, Heart, Sparkles, Languages, Mail, Menu, X, User, Lock 
} from "lucide-react";

const TRANSLATIONS: any = {
  vi: { 
    inbox: "Hộp thư đến", sent: "Đã gửi", compose: "Soạn thư", setting: "Cài đặt", 
    logout: "Đăng xuất", search: "Tìm email...", welcome: "Chào mừng", 
    authSub: "Hệ thống @cuchimail nội bộ", send: "Gửi ngay",
    login: "Đăng nhập", register: "Đăng ký", noAccount: "Chưa có tài khoản?", hasAccount: "Đã có tài khoản?"
  },
  en: { 
    inbox: "Inbox", sent: "Sent", compose: "Compose", setting: "Settings", 
    logout: "Logout", search: "Search email...", welcome: "Welcome", 
    authSub: "@cuchimail system", send: "Send now",
    login: "Login", register: "Register", noAccount: "New here?", hasAccount: "Already have an account?"
  }
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState("inbox");
  const [lang, setLang] = useState("vi");
  const [mails, setMails] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetch = async () => {
      const { data } = await supabase.from("emails").select("*").order("created_at", { ascending: false });
      setMails(data || []);
    };
    fetch();
    const sub = supabase.channel('any').on('postgres_changes', { event: '*', schema: 'public', table: 'emails' }, fetch).subscribe();
    return () => { supabase.removeChannel(sub) };
  }, [session]);

  if (!session) return <AuthUI t={t} lang={lang} setLang={setLang} />;

  const closeMenu = (v: string) => { setView(v); setIsMenuOpen(false); };

  return (
    <div className="cuchi-layout">
      {/* NÚT MENU MOBILE */}
      <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* SIDEBAR */}
      <aside className={`cuchi-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="logo-icon-bg"><Mail size={24} color="#fff" /></div>
          <h2>CuchiMail</h2>
        </div>

        <nav className="cuchi-nav">
          <NavItem icon={<Inbox size={20}/>} label={t.inbox} active={view === "inbox"} onClick={() => closeMenu("inbox")} />
          <NavItem icon={<Send size={20}/>} label={t.sent} active={view === "sent"} onClick={() => closeMenu("sent")} />
          <NavItem icon={<Plus size={20}/>} label={t.compose} active={view === "compose"} onClick={() => closeMenu("compose")} />
          <NavItem icon={<Settings size={20}/>} label={t.setting} active={view === "setting"} onClick={() => closeMenu("setting")} />
        </nav>

        <div className="user-info-sidebar">
           <p>{session.user.email}</p>
           <button className="btn-logout" onClick={() => supabase.auth.signOut()}>{t.logout}</button>
        </div>
      </aside>

      {/* NỀN XANH MINT & NỘI DUNG */}
      <main className="cuchi-main">
        <header className="cuchi-header">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input placeholder={t.search} onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} />
          </div>
        </header>

        <section className="view-container">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="view-content">
              {view === "compose" ? (
                 <ComposeView t={t} user={session.user.email} onDone={() => setView("inbox")} />
              ) : view === "setting" ? (
                 <SettingsView t={t} lang={lang} setLang={setLang} />
              ) : (
                 <MailList mails={mails} view={view} user={session.user.email} search={searchTerm} />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

/* ================= COMPONENT ĐĂNG NHẬP / ĐĂNG KÝ ================= */

function AuthUI({ t, lang, setLang }: any) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    // KIỂM TRA ĐUÔI @CUCHIMAIL
    if (!email.endsWith("@cuchimail") || email.includes(".com")) {
      alert("Lỗi: Email phải kết thúc bằng @cuchimail (Ví dụ: kiet@cuchimail)");
      return;
    }

    setLoading(true);
    const { error } = isRegister 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="aurora-effect"></div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="auth-card glass">
        <div className="auth-header">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="logo-icon-auth">
            <Sparkles size={32} color="#10b981" />
          </motion.div>
          <h2>{isRegister ? t.register : t.login}</h2>
          <p>{t.authSub}</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-box">
            <User size={18} />
            <input type="text" placeholder="username@cuchimail" required onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-box">
            <Lock size={18} />
            <input type="password" placeholder="Password" required onChange={e => setPassword(e.target.value)} />
          </div>
          
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} className="btn-auth-submit">
            {loading ? "..." : (isRegister ? t.register : t.login)}
          </motion.button>
        </form>

        <p className="auth-toggle-text">
          {isRegister ? t.hasAccount : t.noAccount}{" "}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? t.login : t.register}
          </span>
        </p>

        <div className="auth-lang-switcher">
          <Globe size={14} />
          <span onClick={() => setLang('vi')} className={lang === 'vi' ? 'active' : ''}>VI</span>
          <span onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''}>EN</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ================= CÁC COMPONENT PHỤ KHÁC ================= */

function ComposeView({ t, user, onDone }: any) {
  const [to, setTo] = useState("");
  const [sub, setSub] = useState("");
  const [body, setBody] = useState("");

  const handleSend = async () => {
    if (!to.endsWith("@cuchimail") || to.includes(".com")) {
      alert("Chỉ gửi được cho đuôi @cuchimail!");
      return;
    }
    await supabase.from("emails").insert({ sender_email: user, recipient_email: to, subject: sub, body });
    onDone();
  };

  return (
    <div className="compose-clean">
      <div className="compose-header">
        <Sparkles size={20} color="#10b981" />
        <h3>{t.compose}</h3>
      </div>
      <div className="input-group">
        <input placeholder="Người nhận: user@cuchimail" onChange={e => setTo(e.target.value)} />
        <small>Lưu ý: Không dùng .com</small>
      </div>
      <input placeholder="Chủ đề thư" onChange={e => setSub(e.target.value)} />
      <textarea placeholder="Nội dung thư của bạn..." rows={10} onChange={e => setBody(e.target.value)} />
      <button className="btn-send-main" onClick={handleSend}>{t.send}</button>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div className={`cuchi-nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </div>
  );
}

function MailList({ mails, view, user, search }: any) {
    const list = mails.filter((m: any) => {
        const isTarget = view === 'sent' ? m.sender_email === user : m.recipient_email === user;
        return isTarget && m.subject.toLowerCase().includes(search.toLowerCase());
    });
    return (
        <div className="mail-list-clean">
            {list.length > 0 ? list.map((m: any) => (
                <div key={m.id} className="mail-item-clean">
                    <div className="mail-dot"></div>
                    <div className="mail-info">
                        <strong>{m.sender_email.split('@')[0]}</strong>
                        <p>{m.subject}</p>
                    </div>
                    <div className="mail-time">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            )) : <div className="empty-box">Hộp thư trống <Heart size={16} /></div>}
        </div>
    );
}

function SettingsView({ t, lang, setLang }: any) {
    return (
        <div className="setting-page">
            <h2><Languages size={28}/> {t.setting}</h2>
            <div className="setting-card glass">
                <p>{t.lang}</p>
                <div className="lang-btns">
                    <button onClick={() => setLang('vi')} className={lang === 'vi' ? 'active' : ''}>Tiếng Việt</button>
                    <button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''}>English</button>
                </div>
            </div>
        </div>
    );
}