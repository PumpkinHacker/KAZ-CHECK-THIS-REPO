import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Check, Clock3, Gift, History,
  LogOut, Menu, ShieldCheck, Sparkles, UserRound, X
} from "lucide-react";

type Account = { username: string; email: string; salt: string; passwordHash: string };
type GiftRecord = {
  id: string; sender: string; recipient: string; amount: number;
  price: number; status: "Completed"; date: string;
};
type Session = { username: string; email: string };

const AMOUNTS = [
  { amount: 100, price: 1.25, label: "Starter" },
  { amount: 250, price: 2.99, label: "Popular" },
  { amount: 500, price: 5.49, label: "Great value" },
  { amount: 1000, price: 9.99, label: "Big gift" },
];
const ACCOUNTS_KEY = "giftlab_demo_accounts_v1";
const SESSION_KEY = "giftlab_demo_session_v1";
const HISTORY_KEY = "giftlab_demo_history_v1";

function readStore<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch { return fallback; }
}
function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashPassword(password: string, saltHex: string) {
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((v) => parseInt(v, 16)) ?? []);
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, material, 256);
  return bytesToHex(new Uint8Array(bits));
}
function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
function App() {
  const [session, setSession] = useState<Session | null>(() => readStore<Session | null>(SESSION_KEY, null));
  const [accounts, setAccounts] = useState<Account[]>(() => readStore<Account[]>(ACCOUNTS_KEY, []));
  const [history, setHistory] = useState<GiftRecord[]>(() => readStore<GiftRecord[]>(HISTORY_KEY, []));
  const [selected, setSelected] = useState(250);
  const [recipient, setRecipient] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem(HISTORY_KEY, JSON.stringify(history)), [history]);
  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const chosen = AMOUNTS.find((item) => item.amount === selected) ?? AMOUNTS[1];
  const myGifts = useMemo(() => history.filter((item) => item.sender.toLowerCase() === session?.username.toLowerCase()), [history, session]);
  const initials = session?.username.slice(0, 1).toUpperCase() ?? "G";

  function openAuth(mode: "login" | "signup") {
    setAuthMode(mode); setAuthError(""); setPassword(""); setAuthOpen(true);
  }
  async function submitAuth(event: React.FormEvent) {
    event.preventDefault(); setAuthError("");
    const cleanName = username.trim();
    if (password.length < 6) { setAuthError("Use at least 6 characters for your demo password."); return; }
    if (authMode === "signup") {
      if (cleanName.length < 3) { setAuthError("Your username must be at least 3 characters."); return; }
      if (!email.includes("@")) { setAuthError("Enter a valid email address."); return; }
      if (accounts.some((a) => a.username.toLowerCase() === cleanName.toLowerCase() || a.email.toLowerCase() === email.trim().toLowerCase())) {
        setAuthError("That username or email is already registered on this device."); return;
      }
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      const passwordHash = await hashPassword(password, salt);
      const account = { username: cleanName, email: email.trim(), salt, passwordHash };
      setAccounts((old) => [...old, account]);
      setSession({ username: account.username, email: account.email });
      setAuthOpen(false); setUsername(""); setEmail(""); setPassword("");
      return;
    }
    const account = accounts.find((a) => a.username.toLowerCase() === cleanName.toLowerCase() || a.email.toLowerCase() === cleanName.toLowerCase());
    if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
      setAuthError("We couldn't find a matching demo account and password."); return;
    }
    setSession({ username: account.username, email: account.email });
    setAuthOpen(false); setUsername(""); setEmail(""); setPassword("");
  }
  function sendGift() {
    if (!session) { setConfirmOpen(false); openAuth("signup"); return; }
    if (recipient.trim().length < 3) { setNotice("Enter a recipient username first."); return; }
    const record: GiftRecord = {
      id: crypto.randomUUID(), sender: session.username, recipient: recipient.trim(),
      amount: chosen.amount, price: chosen.price, status: "Completed", date: new Date().toISOString()
    };
    setHistory((old) => [record, ...old]);
    setRecipient(""); setConfirmOpen(false);
    setNotice("Demo gift sent! This was recorded only in your local simulator.");
    window.setTimeout(() => setNotice(""), 5000);
  }

  return (
    <div className="dark-theme min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-xs font-medium text-blue-800">
        Fan-made simulator · Simulated Robux only · No real Robux transfers or payments
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5" aria-label="Roblox Gifter home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white"><Gift size={19} /></span>
            <span className="text-lg font-extrabold tracking-tight">Roblox Gifter<span className="text-blue-600">.</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a className="transition hover:text-blue-600" href="#gifting">Send a gift</a>
            <a className="transition hover:text-blue-600" href="#history">Gift history</a>
            <a className="transition hover:text-blue-600" href="#about">About</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{initials}</div>
                <div className="leading-tight"><p className="text-sm font-semibold">{session.username}</p><p className="text-[11px] text-slate-500">Demo account</p></div>
                <button className="btn-secondary ml-1 px-3 py-2" onClick={() => setSession(null)}><LogOut size={15} /> Sign out</button>
              </div>
            ) : <><button className="btn-secondary" onClick={() => openAuth("login")}>Log in</button><button className="btn-primary !px-4 !py-2.5" onClick={() => openAuth("signup")}>Create account <ArrowRight size={15} /></button></>}
          </div>
          <button className="rounded-lg p-2 text-slate-600 md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">{mobileOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileOpen && <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-medium">
            <a href="#gifting" onClick={() => setMobileOpen(false)}>Send a gift</a><a href="#history" onClick={() => setMobileOpen(false)}>Gift history</a>
            {session ? <button className="text-left text-slate-600" onClick={() => { setSession(null); setMobileOpen(false); }}>Sign out</button> : <div className="flex gap-2"><button className="btn-secondary flex-1" onClick={() => openAuth("login")}>Log in</button><button className="btn-primary flex-1" onClick={() => openAuth("signup")}>Create account</button></div>}
          </div>
        </div>}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <section className="grid items-center gap-10 pb-16 md:grid-cols-[1.1fr_.9fr] md:pb-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"><Sparkles size={14} /> A little fun, just for the demo</div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[58px]">Make someone's day with a <span className="text-blue-600">virtual gift.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">Pick a demo amount, enter a username and see how a gifting experience works. Simple, quick and completely simulated.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a className="btn-primary" href="#gifting">Explore gifting options <ArrowRight size={16} /></a>
              <span className="text-xs text-slate-400">No checkout or payment required</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-blue-600" /> Demo-only experience</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-blue-600" /> Instant demo history</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue-100/70 blur-2xl" />
            <div className="panel relative overflow-hidden p-6 sm:p-8">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Your gifting preview</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Demo mode</span></div>
              <div className="my-8 flex items-center justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-blue-50">
                  <div className="absolute inset-4 rounded-full border border-blue-100" />
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200"><Gift size={43} strokeWidth={1.5} /></div>
                  <span className="absolute -right-1 top-7 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-md"><Sparkles size={18} /></span>
                  <span className="absolute -bottom-1 left-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-500 shadow-md"><Check size={18} /></span>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Selected gift</span><strong>{selected.toLocaleString()} simulated Robux</strong></div>
                <div className="mt-2 flex items-center justify-between text-sm"><span className="text-slate-500">Demo value</span><strong className="text-blue-600">{money(chosen.price)}</strong></div>
              </div>
              <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">Illustrative values only. Not official Roblox prices or currency.</p>
            </div>
          </div>
        </section>

        <section id="gifting" className="scroll-mt-28 py-8">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">The gifting desk</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Choose your gift</h2><p className="mt-2 text-sm text-slate-500">Select a demo package to preview your gift.</p></div>
            <span className="text-xs text-slate-400">All amounts are fictional simulated Robux</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AMOUNTS.map((item) => <button key={item.amount} onClick={() => setSelected(item.amount)} className={`relative rounded-xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${selected === item.amount ? "border-blue-500 ring-4 ring-blue-50" : "border-slate-200"}`}>
              {item.label === "Popular" && <span className="absolute -top-2.5 right-4 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">POPULAR</span>}
              <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Gift size={19} /></span>{selected === item.amount && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"><Check size={14} /></span>}</div>
              <p className="mt-5 text-2xl font-extrabold tracking-tight">{item.amount.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">Simulated Robux</p>
              <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-lg font-bold text-blue-600">{money(item.price)}</p><p className="mt-1 text-[11px] text-slate-400">Illustrative demo value</p></div>
            </button>)}
          </div>
          <div className="panel mt-6 grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-end">
            <div><label htmlFor="recipient" className="mb-2 block text-sm font-semibold">Recipient username</label><input id="recipient" className="field max-w-xl" placeholder="Enter a friend's display username" value={recipient} onChange={(e) => setRecipient(e.target.value)} /><p className="mt-2 text-xs text-slate-400">This is only a name in your local demo history. No Roblox account is contacted.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="mr-2"><p className="text-xs text-slate-400">Demo total</p><p className="text-xl font-bold">{money(chosen.price)}</p></div><button className="btn-primary whitespace-nowrap" onClick={() => { if (!session) openAuth("signup"); else if (recipient.trim().length < 3) setNotice("Enter a recipient username first."); else setConfirmOpen(true); }}>Preview gift <ArrowRight size={16} /></button></div>
          </div>
        </section>

        <section id="history" className="scroll-mt-28 py-16">
          <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Your activity</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Gift history</h2><p className="mt-2 text-sm text-slate-500">A record of gifts created in this browser.</p></div><span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{myGifts.length} gifts</span></div>
          <div className="panel overflow-hidden">
            {!session ? <div className="flex flex-col items-center px-5 py-14 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><History size={22} /></span><h3 className="mt-4 font-semibold">Log in to view your history</h3><p className="mt-1 max-w-sm text-sm text-slate-500">Your demo gifts will appear here after you sign in.</p><button className="btn-primary mt-5" onClick={() => openAuth("login")}>Log in <ArrowRight size={15} /></button></div> : myGifts.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><History size={22} /></span><h3 className="mt-4 font-semibold">No gifts yet</h3><p className="mt-1 text-sm text-slate-500">Your first simulated gift will show up here.</p></div> :
              <div className="divide-y divide-slate-100">{myGifts.map((gift) => <div key={gift.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Gift size={18} /></span><div><p className="text-sm font-semibold">Gift to {gift.recipient}</p><p className="mt-1 text-xs text-slate-400">{new Date(gift.date).toLocaleString()}</p></div></div><div className="ml-auto text-right"><p className="text-sm font-bold">{gift.amount.toLocaleString()} Robux</p><p className="mt-1 text-xs font-medium text-emerald-600">Demo completed</p></div></div>)}</div>}
          </div>
        </section>

        <section id="about" className="rounded-2xl bg-slate-900 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-300">A quick note</p><h2 className="mt-2 text-2xl font-bold">Just for fun. Clearly a demo.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Roblox Gifter is an independent fan-made interface concept. It is not affiliated with Roblox. Simulated Robux have no cash value, and this site does not send Robux, process payments or connect to Roblox accounts.</p></div><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-blue-200"><ShieldCheck size={27} /></span></div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6"><span className="font-bold tracking-tight text-slate-700">Roblox Gifter<span className="text-blue-600">.</span></span><span>Independent fan-made demo · Not affiliated with Roblox · No real Robux or payments</span><a href="#about" className="font-medium text-blue-600 hover:text-blue-700">About this simulator</a></div></footer>

      {notice && <div role="status" className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-xl border border-blue-100 bg-white p-4 text-sm shadow-xl"><span className="mt-0.5 text-blue-600"><Check size={17} /></span><span className="flex-1 text-slate-700">{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16} /></button></div>}

      {authOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-start justify-between"><div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={20} /></span><h2 className="mt-4 text-xl font-bold">{authMode === "signup" ? "Create your account" : "Welcome back"}</h2><p className="mt-1 text-sm text-slate-500">{authMode === "signup" ? "Set up a local demo profile." : "Log in to your local demo profile."}</p></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" onClick={() => setAuthOpen(false)}><X size={19} /></button></div>
          <form onSubmit={submitAuth} className="space-y-4">
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">{authMode === "signup" ? "Username" : "Username or email"}</label><input className="field" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={authMode === "signup" ? "Choose a username" : "Your username or email"} required /></div>
            {authMode === "signup" && <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Email address</label><input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>}
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-600">Password</label><input className="field" type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} /></div>
            {authError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{authError}</p>}
            <p className="text-[11px] leading-5 text-slate-400">Demo accounts are stored only in this browser. Do not use a real password. This is not production authentication.</p>
            <button type="submit" className="btn-primary w-full">{authMode === "signup" ? "Create demo account" : "Log in"} <ArrowRight size={15} /></button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">{authMode === "signup" ? "Already have an account?" : "New to Roblox Gifter?"} <button className="font-semibold text-blue-600 hover:text-blue-700" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }}>{authMode === "signup" ? "Log in" : "Create an account"}</button></p>
        </div>
      </div>}

      {confirmOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}>
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Gift size={21} /></div>
          <h2 className="mt-4 text-xl font-bold">Confirm demo gift</h2><p className="mt-1 text-sm text-slate-500">Review the details before adding it to your local history.</p>
          <div className="my-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Recipient</span><strong>{recipient}</strong></div><div className="flex justify-between"><span className="text-slate-500">Amount</span><strong>{selected.toLocaleString()} simulated Robux</strong></div><div className="flex justify-between"><span className="text-slate-500">Illustrative value</span><strong>{money(chosen.price)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Payment due</span><strong className="text-emerald-700">$0.00</strong></div></div>
          <p className="mb-4 text-xs leading-5 text-slate-400">This does not contact Roblox, transfer Robux or charge a payment method.</p>
          <div className="flex gap-2"><button className="btn-secondary flex-1" onClick={() => setConfirmOpen(false)}>Cancel</button><button className="btn-primary flex-1" onClick={sendGift}>Confirm gift <Check size={15} /></button></div>
        </div>
      </div>}
    </div>
  );
}
export default App;