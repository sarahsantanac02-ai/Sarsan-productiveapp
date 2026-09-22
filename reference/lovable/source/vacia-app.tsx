import { useMemo, useState, type ReactNode } from "react";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Droplets,
  Flame,
  Home,
  ImagePlus,
  Mic,
  Moon,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Sun,
  UserRound,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View = "hoy" | "calendario" | "mi" | "finanzas" | "todo";
type Modal = "voice" | "date" | "label" | "manual" | null;

const labelStyles = {
  sapq: { bar: "border-label-sapq", soft: "bg-label-sapq-soft", text: "text-label-sapq", dot: "bg-label-sapq", emoji: "S" },
  uni: { bar: "border-label-uni", soft: "bg-label-uni-soft", text: "text-label-uni", dot: "bg-label-uni", emoji: "🎓" },
  twelve: { bar: "border-label-twelve", soft: "bg-label-twelve-soft", text: "text-label-twelve", dot: "bg-label-twelve", emoji: "12" },
  casa: { bar: "border-label-casa", soft: "bg-label-casa-soft", text: "text-label-casa", dot: "bg-label-casa", emoji: "🏠" },
  personal: { bar: "border-label-personal", soft: "bg-label-personal-soft", text: "text-label-personal", dot: "bg-label-personal", emoji: "✦" },
};

type LabelKey = keyof typeof labelStyles;

const tasks: Array<{ title: string; label: string; kind: LabelKey; time: string; band: string; urgent?: boolean; notion?: boolean }> = [
  { title: "Cerrar propuesta de research", label: "SAPQ", kind: "sapq", time: "Hoy · 11:30 a. m.", band: "Foco", urgent: true, notion: true },
  { title: "Entregar prototipo de interacción", label: "Universidad", kind: "uni", time: "Hoy · 4:00 p. m.", band: "Segundo aire", notion: true },
  { title: "Comprar mercado y arena de Moka", label: "Casa Suba", kind: "casa", time: "Hoy", band: "Cierre" },
];

const navItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "hoy", label: "Hoy", icon: Home },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "mi", label: "Mí", icon: UserRound },
  { id: "finanzas", label: "Finanzas", icon: CircleDollarSign },
  { id: "todo", label: "Todo", icon: Sparkles },
];

export function VaciaApp() {
  const [view, setView] = useState<View>("hoy");
  const [modal, setModal] = useState<Modal>(null);
  const [dark, setDark] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [calendarMode, setCalendarMode] = useState<"día" | "mes">("día");
  const [financeMode, setFinanceMode] = useState<"gastos" | "ingresos">("gastos");
  const [water, setWater] = useState(1.75);

  const title = navItems.find((item) => item.id === view)?.label ?? "Hoy";
  const screen = useMemo(() => {
    if (view === "calendario") return <CalendarScreen mode={calendarMode} onMode={setCalendarMode} />;
    if (view === "mi") return <MeScreen water={water} onWater={setWater} />;
    if (view === "finanzas") return <FinanceScreen mode={financeMode} onMode={setFinanceMode} />;
    if (view === "todo") return <AllScreen />;
    return <TodayScreen completed={completed} setCompleted={setCompleted} />;
  }, [view, calendarMode, financeMode, water, completed]);

  return (
    <main className={cn("min-h-dvh bg-app-shell px-0 py-0 sm:px-6 sm:py-7", dark && "dark")}>
      <div className="relative mx-auto min-h-dvh w-full overflow-hidden bg-background sm:min-h-[844px] sm:max-w-[390px] sm:rounded-[28px] sm:border sm:border-border">
        <header className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-none" aria-label="Navegación principal">
              {navItems.slice(1).map((item) => (
                <Button key={item.id} variant={view === item.id ? "pillActive" : "pill"} size="sm" onClick={() => setView(item.id)}>
                  {item.label}
                </Button>
              ))}
            </div>
            <Button variant="energy" size="iconSm" aria-label="Energía disponible"><Zap /> 3</Button>
            <Button variant="ghost" size="iconSm" aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"} onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Settings2 />}
            </Button>
          </div>
        </header>

        <div className="pb-32">{screen}</div>

        <Dock active={view} title={title} onNavigate={setView} onVoice={() => setModal("voice")} onManual={() => setModal("manual")} />
        {modal === "voice" && <VoiceSheet onClose={() => setModal(null)} onDone={() => setModal("date")} />}
        {modal === "date" && <DateSheet onClose={() => setModal(null)} />}
        {modal === "label" && <LabelSheet onClose={() => setModal(null)} />}
        {modal === "manual" && <ManualSheet onClose={() => setModal(null)} onLabel={() => setModal("label")} />}
      </div>
    </main>
  );
}

function TodayScreen({ completed, setCompleted }: { completed: number[]; setCompleted: (value: number[]) => void }) {
  const [energy, setEnergy] = useState(1);
  const bands = [
    { name: "Arranque", time: "6–9", h: "h-8" },
    { name: "Foco", time: "9–12", h: "h-14" },
    { name: "Bajón", time: "12–3", h: "h-6" },
    { name: "2º aire", time: "3–7", h: "h-11" },
    { name: "Cierre", time: "7–10", h: "h-7" },
  ];
  return (
    <div className="space-y-6 px-4 pt-3">
      <section>
        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Martes</p>
        <h1 className="font-display text-[34px] font-bold leading-none">Hoy <span className="text-muted-foreground">22 sep</span></h1>
      </section>

      <section aria-label="Energía del día">
        <div className="flex h-24 items-end justify-between gap-2">
          {bands.map((band, index) => (
            <Button key={band.name} variant="energyBand" className="h-auto flex-1 px-0" onClick={() => setEnergy(index)}>
              <span className={cn("w-full rounded-md", band.h, energy === index ? "bg-primary" : "bg-primary/14")} />
              <span className={cn("whitespace-normal text-[10px] leading-tight", energy === index ? "text-foreground" : "text-muted-foreground")}>{band.name}</span>
              <span className="text-[9px] font-normal text-muted-foreground">{band.time}</span>
            </Button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><BatteryCharging size={17} /></span>
            <div>
              <p className="text-sm font-semibold">{bands[energy]?.name ?? "Foco"} · tu mejor momento para avanzar</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Protege este bloque. Tienes “Propuesta de research” a las 11:30.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          <TagChip kind="sapq">SAPQ</TagChip><TagChip kind="uni">Universidad</TagChip><TagChip kind="twelve">Twelve Sent</TagChip><TagChip kind="casa">Casa Suba</TagChip><TagChip kind="personal">Personal</TagChip>
          <Button variant="chip" size="sm"><Plus /> Nueva etiqueta</Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Lo que tienes hoy</h2><span className="text-xs text-muted-foreground">3 pendientes</span></div>
        {tasks.map((task, index) => (
          <TaskCard key={task.title} task={task} checked={completed.includes(index)} onCheck={() => setCompleted(completed.includes(index) ? completed.filter((item) => item !== index) : [...completed, index])} />
        ))}
      </section>
    </div>
  );
}

function TaskCard({ task, checked, onCheck }: { task: (typeof tasks)[number]; checked: boolean; onCheck: () => void }) {
  const style = labelStyles[task.kind];
  return (
    <article className={cn("rounded-2xl border border-border border-l-[5px] bg-card p-3.5", style.bar, checked && "opacity-55")}>
      <div className="flex gap-3">
        <Button variant={checked ? "checkActive" : "check"} size="iconSm" onClick={onCheck} aria-label={checked ? "Marcar pendiente" : "Completar tarea"}>{checked && <Check />}</Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("font-display text-sm font-semibold leading-snug", checked && "line-through")}>{task.title}</p>
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold", style.soft, style.text)}>{style.emoji}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className={cn("tag", task.urgent ? "tag-urgent" : "tag-date")}><Clock3 />{task.time}</span>
            <span className="tag tag-neutral"><Zap />{task.band}</span>
            {task.notion && <span className="tag tag-neutral">N · Colocar en Notion</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

function TagChip({ kind, children }: { kind: LabelKey; children: ReactNode }) {
  const style = labelStyles[kind];
  return <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold", style.soft, style.text, style.bar)}><span className={cn("size-2 rounded-full", style.dot)} />{children}</span>;
}

function CalendarScreen({ mode, onMode }: { mode: "día" | "mes"; onMode: (value: "día" | "mes") => void }) {
  return (
    <div className="px-4 pt-3">
      <ScreenTitle eyebrow="Septiembre 2026" title="Calendario" action={<Segmented value={mode} items={["día", "mes"]} onChange={(v) => onMode(v as "día" | "mes")} />} />
      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between"><p className="font-display text-sm font-semibold">Ocupada 5 h <span className="font-normal text-muted-foreground">· Libre 11 h</span></p><span className="text-xs text-muted-foreground">Hoy</span></div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full"><span className="w-[31%] bg-label-sapq"/><span className="w-[14%] bg-label-uni"/><span className="w-[9%] bg-label-personal"/><span className="flex-1 bg-muted"/></div>
      </div>
      {mode === "día" ? <DayCalendar /> : <MonthCalendar />}
    </div>
  );
}

function DayCalendar() {
  const hours = ["8 a. m.", "9 a. m.", "10 a. m.", "11 a. m.", "12 p. m.", "1 p. m.", "2 p. m.", "3 p. m.", "4 p. m.", "5 p. m."];
  return (
    <section className="relative mt-5 h-[560px] overflow-hidden rounded-2xl border border-border bg-card pt-2">
      {hours.map((hour) => <div key={hour} className="grid h-14 grid-cols-[58px_1fr]"><span className="pr-2 pt-1 text-right text-[10px] text-muted-foreground">{hour}</span><span className="border-t border-border" /></div>)}
      <CalendarEvent className="left-[62px] right-3 top-[68px] h-[72px] bg-label-sapq-soft text-label-sapq" time="9:00–10:15" title="Daily + research SAPQ" />
      <CalendarEvent className="left-[62px] top-[160px] h-[92px] w-[44%] bg-label-uni-soft text-label-uni" time="10:40–12:10" title="Clase: Diseño de interacción" />
      <CalendarEvent className="right-3 top-[176px] h-[62px] w-[39%] bg-label-twelve-soft text-label-twelve" time="11:00–12:00" title="Revisión Twelve Sent" />
      <CalendarEvent className="left-[62px] right-3 top-[350px] h-[55px] bg-label-personal-soft text-label-personal" time="3:00–4:00" title="Gym" />
      <div className="absolute left-11 right-0 top-[278px] z-20 flex items-center"><span className="size-2 rounded-full bg-urgent"/><span className="h-px flex-1 bg-urgent"/></div>
    </section>
  );
}

function CalendarEvent({ className, time, title }: { className: string; time: string; title: string }) {
  return <div className={cn("absolute rounded-lg border-l-4 border-current p-2", className)}><p className="text-[10px] font-semibold">{time}</p><p className="mt-0.5 text-xs font-semibold leading-tight">{title}</p></div>;
}

function MonthCalendar() {
  const days = Array.from({ length: 35 }, (_, i) => i - 1);
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between"><Button variant="ghost" size="iconSm"><ArrowLeft /></Button><p className="font-display font-semibold">Septiembre</p><Button variant="ghost" size="iconSm"><ArrowRight /></Button></div>
      <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">{["L","M","M","J","V","S","D"].map((d, i)=><span key={`${d}${i}`} className="py-2">{d}</span>)}</div>
      <div className="grid grid-cols-7">{days.map((day, i) => <div key={i} className={cn("relative flex aspect-square items-start justify-center border-t border-border pt-2 text-xs", (day < 1 || day > 30) && "text-muted-foreground/30", day === 22 && "rounded-xl bg-primary font-bold text-primary-foreground")}><span>{day < 1 ? 31 : day > 30 ? day - 30 : day}</span>{[4,8,11,15,18,22,24,28].includes(day) && <span className={cn("absolute bottom-2 size-1 rounded-full", day===22 ? "bg-primary-foreground" : "bg-label-uni")} />}</div>)}</div>
    </section>
  );
}

function MeScreen({ water, onWater }: { water: number; onWater: (value: number) => void }) {
  const habits = ["Leer 20 min", "Abdomen", "Gym", "Evangelio", "Crema", "Desayuno", "Almuerzo", "Cena"];
  const [done, setDone] = useState([0, 1, 3, 5, 6]);
  return (
    <div className="space-y-5 px-4 pt-3">
      <ScreenTitle eyebrow="Cuidarme también cuenta" title="Mí" />
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="progress-ring" style={{ "--progress": "62.5%" } as React.CSSProperties}><span className="font-display text-lg font-bold">5/8</span></div>
          <div><h2 className="font-display font-semibold">No negociables</h2><p className="mt-1 text-xs text-muted-foreground">Vas bien. Tres más y cierras el día.</p></div>
        </div>
        <div className="mt-4 divide-y divide-border">{habits.map((habit, i) => <div key={habit} className="flex min-h-11 items-center gap-2.5 py-2"><Button variant={done.includes(i) ? "checkActive" : "check"} size="iconSm" onClick={() => setDone(done.includes(i) ? done.filter(v=>v!==i) : [...done,i])}>{done.includes(i) && <Check />}</Button><span className="flex-1 text-sm font-medium">{habit}</span>{i < 4 && <span className="flex items-center gap-0.5 text-xs text-urgent"><Flame size={13}/> {7-i}</span>}{i===0 && <Button variant="soft" size="sm">Escribir resumen</Button>}</div>)}</div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <SectionHeading icon={<Droplets />} title="Agua" meta={`${water.toFixed(2)} / 3 L`} />
        <div className="my-4 flex justify-center gap-4">{[1,2,3].map((bottle) => <div key={bottle} className="water-bottle"><span style={{height: `${Math.min(100, Math.max(0, (water-(bottle-1))*100))}%`}} /></div>)}</div>
        <div className="grid grid-cols-3 gap-2">{[0.25,0.5,1].map(value=><Button key={value} variant="soft" onClick={()=>onWater(Math.min(3,water+value))}>+{value === 0.25 ? "¼" : value === 0.5 ? "½" : "1"}</Button>)}</div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4">
        <SectionHeading icon={<Utensils />} title="Comida" meta="1.420 / 2.000 kcal" />
        <div className="mt-4 grid grid-cols-3 gap-2"><Macro value="78 g" label="Proteína"/><Macro value="146 g" label="Carbos"/><Macro value="44 g" label="Grasas"/></div>
        <Button variant="outline" className="mt-4 w-full"><Camera /> Foto de mi comida</Button>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4"><SectionHeading icon={<Zap />} title="Energizantes" meta="240 / 400 mg"/><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/5 bg-amber"/></div><div className="mt-4 grid grid-cols-3 gap-2">{["🔵 Red Bull","🟢 Monster","🟡 Vive 100","🟠 Amper","☕ Tinto","＋ Otro"].map(item=><Button key={item} variant="tile">{item}</Button>)}</div></section>
      <section className="rounded-2xl border border-border bg-card p-4"><SectionHeading icon={<Moon />} title="Ciclo" meta="Promedio 29 días"/><div className="cycle-chart mt-5">{[26,30,28,31,29,27].map((v,i)=><span key={i} style={{height:`${v*2.1}px`}}><i>{v}</i></span>)}<div /></div><Button variant="outline" className="mt-4 w-full">Me llegó</Button></section>
    </div>
  );
}

function SectionHeading({ icon, title, meta }: { icon: ReactNode; title: string; meta: string }) { return <div className="flex items-center gap-2"><span className="text-primary [&_svg]:size-4">{icon}</span><h2 className="font-display font-semibold">{title}</h2><span className="ml-auto text-xs text-muted-foreground">{meta}</span></div>; }
function Macro({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-muted p-3 text-center"><p className="font-display text-sm font-semibold">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div>; }

function FinanceScreen({ mode, onMode }: { mode: "gastos" | "ingresos"; onMode: (v: "gastos"|"ingresos")=>void }) {
  const categories = [{e:"🍜",n:"Comida",v:"$486.000",w:"w-[74%]"},{e:"🚕",n:"Transporte",v:"$218.400",w:"w-[43%]"},{e:"🏠",n:"Casa",v:"$164.000",w:"w-[32%]"},{e:"✨",n:"Personal",v:"$98.900",w:"w-[20%]"}];
  return <div className="space-y-5 px-4 pt-3"><ScreenTitle eyebrow="Tu plata, sin enredos" title="Finanzas"/><Segmented value={mode} items={["gastos","ingresos"]} onChange={(v)=>onMode(v as "gastos"|"ingresos")}/><div className="flex items-center justify-center gap-3"><Button variant="ghost" size="iconSm"><ArrowLeft/></Button><span className="text-sm font-semibold">Septiembre</span><Button variant="ghost" size="iconSm"><ArrowRight/></Button></div><div className="text-center"><p className="text-xs text-muted-foreground">{mode === "gastos" ? "Has gastado" : "Has recibido"}</p><p className="mt-1 font-display text-[38px] font-bold tracking-normal">{mode === "gastos" ? "$1.247.300" : "$3.890.000"}</p></div><div className="flex items-center rounded-2xl border border-border bg-card p-2 pl-4"><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Ej: almuerzo 18 mil con Nequi"/><Button variant="default" size="icon"><Mic/></Button></div><section className="space-y-4 rounded-2xl border border-border bg-card p-4"><h2 className="font-display font-semibold">Por categoría</h2>{categories.map(cat=><div key={cat.n}><div className="mb-1.5 flex text-xs"><span>{cat.e} {cat.n}</span><span className="ml-auto font-semibold">{cat.v}</span></div><div className="h-2 rounded-full bg-muted"><div className={cn("h-full rounded-full bg-primary",cat.w)}/></div></div>)}</section><section><div className="mb-3 flex items-center justify-between"><h2 className="font-display font-semibold">Por dónde salió</h2><span className="rounded-full bg-amber-soft px-2 py-1 text-[10px] font-semibold text-amber-strong">$342 mil a crédito</span></div><div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4">{[{n:"Nequi",e:"N",v:"$458.200"},{n:"Nu crédito",e:"nu",v:"$342.000"},{n:"Davivienda",e:"D",v:"$278.100"},{n:"Efectivo",e:"$",v:"$169.000"}].map(card=><article key={card.n} className="min-w-36 rounded-2xl border border-border bg-card p-4"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-xs font-bold text-primary">{card.e}</span><p className="mt-4 text-xs text-muted-foreground">{card.n}</p><p className="mt-1 font-display font-semibold">{card.v}</p></article>)}</div></section><section><h2 className="mb-3 font-display font-semibold">Movimientos</h2><div className="rounded-2xl border border-border bg-card p-4"><p className="mb-3 text-xs font-semibold text-muted-foreground">HOY · 22 SEP</p>{[["🍜","Almuerzo","Nequi","-$18.000"],["🚕","Uber a la U","Nu crédito","-$14.900"],["☕","Tinto","Efectivo","-$3.000"]].map(row=><div key={row[1]} className="flex items-center gap-3 border-t border-border py-3 first:border-0"><span className="text-xl">{row[0]}</span><div className="flex-1"><p className="text-sm font-medium">{row[1]}</p><p className="text-[10px] text-muted-foreground">{row[2]}</p></div><span className="text-sm font-semibold">{row[3]}</span></div>)}</div></section></div>;
}

function AllScreen() { return <div className="px-4 pt-3"><ScreenTitle eyebrow="Sin perder nada" title="Todo"/><div className="mt-6 flex items-center rounded-2xl border border-border bg-card p-2 pl-4"><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Buscar una tarea…"/><Button variant="ghost" size="icon"><Sparkles/></Button></div><div className="mt-5 space-y-3">{tasks.concat([{title:"Enviar factura de septiembre",label:"Twelve Sent",kind:"twelve",time:"24 sep",band:"Foco",notion:false}]).map((task,i)=><TaskCard key={task.title} task={task as (typeof tasks)[number]} checked={false} onCheck={()=>undefined}/>)}</div><EmptyState title="Eso es todo por ahora" copy="Cuando sueltes algo nuevo, aparecerá aquí."/></div>; }

function ScreenTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) { return <div className="flex items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</p><h1 className="font-display text-[32px] font-bold leading-none">{title}</h1></div>{action}</div>; }
function Segmented({ value, items, onChange }: { value:string; items:string[]; onChange:(value:string)=>void }) { return <div className="flex rounded-xl bg-muted p-1">{items.map(item=><Button key={item} variant={value===item ? "segmentActive":"segment"} size="sm" onClick={()=>onChange(item)} className="capitalize">{item}</Button>)}</div>; }
function EmptyState({ title, copy }: { title:string; copy:string }) { return <div className="py-10 text-center"><span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Sparkles/></span><p className="mt-3 font-display text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{copy}</p></div>; }

function Dock({ active, onNavigate, onVoice, onManual }: { active: View; title:string; onNavigate:(v:View)=>void; onVoice:()=>void; onManual:()=>void }) {
  return <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[86px] w-full max-w-[390px] items-center justify-around border-t border-border bg-background/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-xl"><Button variant={active==="hoy"?"dockActive":"dock"} size="dock" onClick={()=>onNavigate("hoy")}><Home/><span>Hoy</span></Button><Button variant={active==="calendario"?"dockActive":"dock"} size="dock" onClick={()=>onNavigate("calendario")}><CalendarDays/><span>Agenda</span></Button><Button variant="mic" size="mic" onClick={onVoice} aria-label="Soltar por voz"><Mic/></Button><Button variant="pencil" size="dock" onClick={onManual}><Pencil/><span>Escribir</span></Button><Button variant={active==="mi"?"dockActive":"dock"} size="dock" onClick={()=>onNavigate("mi")}><UserRound/><span>Mí</span></Button></nav>;
}

function SheetFrame({ children, onClose }: { children: ReactNode; onClose:()=>void }) { return <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[390px] items-end bg-overlay"><section className="sheet-enter relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[24px] bg-background px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border"/><Button variant="ghost" size="iconSm" className="absolute right-4 top-4" onClick={onClose} aria-label="Cerrar"><X/></Button>{children}</section></div>; }
function VoiceSheet({ onClose, onDone }: { onClose:()=>void; onDone:()=>void }) { return <SheetFrame onClose={onClose}><div className="text-center"><span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-urgent-soft text-urgent"><span className="pulse-dot size-4 rounded-full bg-urgent"/></span><h2 className="font-display text-2xl font-bold">Escuchando</h2><p className="mt-2 text-sm text-muted-foreground">Habla como te salga. Yo lo ordeno.</p></div><div className="my-6 min-h-24 rounded-2xl border border-border bg-card p-4"><p className="text-sm leading-relaxed">“Mañana tengo que enviar la factura de Twelve Sent y recordar comprar la crema…”</p><span className="typing-cursor" /></div><div className="mb-5"><p className="text-[10px] font-semibold uppercase text-muted-foreground">También puedes decir</p><div className="mt-2 flex flex-wrap gap-2"><span className="example-chip">“el viernes”</span><span className="example-chip">“es urgente”</span><span className="example-chip">“para la U”</span></div></div><Button variant="default" size="lg" className="w-full" onClick={onDone}><Check/> Listo, ordénalo</Button></SheetFrame>; }
function DateSheet({ onClose }: { onClose:()=>void }) { const [selected,setSelected]=useState("Mañana"); return <SheetFrame onClose={onClose}><p className="text-xs font-semibold text-primary">UN PASO MÁS</p><h2 className="mt-1 pr-8 font-display text-2xl font-bold leading-tight">¿Para cuándo necesitas esto listo?</h2><div className="my-5 grid grid-cols-2 gap-2">{["Hoy","Mañana","Este viernes","Este fin de semana"].map(option=><Button key={option} variant={selected===option?"choiceActive":"choice"} onClick={()=>setSelected(option)}>{option}</Button>)}</div><label className="mb-2 block text-xs font-semibold">Otra fecha</label><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3"><CalendarDays className="size-4 text-muted-foreground"/><input type="date" className="h-12 flex-1 bg-transparent text-sm outline-none"/></div><div className="mt-4 flex gap-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Sin fecha</Button><Button variant="default" className="flex-1" onClick={onClose}>Guardar</Button></div></SheetFrame>; }
function ManualSheet({ onClose, onLabel }: { onClose:()=>void; onLabel:()=>void }) { return <SheetFrame onClose={onClose}><p className="text-xs font-semibold text-primary">NUEVA TAREA</p><h2 className="mt-1 font-display text-2xl font-bold">Sácalo de tu cabeza</h2><textarea autoFocus rows={3} className="mt-5 w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none focus:border-primary" placeholder="¿Qué tienes pendiente?"/><div className="mt-3 flex gap-2"><Button variant="chip" onClick={onLabel}><Plus/> Etiqueta</Button><Button variant="chip"><CalendarDays/> Fecha</Button><Button variant="chip"><Zap/> Franja</Button></div><Button variant="default" size="lg" className="mt-6 w-full" onClick={onClose}>Guardar tarea</Button></SheetFrame>; }
function LabelSheet({ onClose }: { onClose:()=>void }) { const [emoji,setEmoji]=useState("🎨"); const [color,setColor]=useState(0); return <SheetFrame onClose={onClose}><p className="text-xs font-semibold text-primary">NUEVA ETIQUETA</p><h2 className="mt-1 font-display text-2xl font-bold">Dale un lugar</h2><div className="mt-5 flex gap-3"><span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-2xl">{emoji}</span><div className="flex-1 space-y-2"><input className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" placeholder="Nombre"/><input className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" placeholder="Descripción corta"/></div></div><Button variant="outline" className="mt-4 w-full"><ImagePlus/> Subir logo</Button><p className="mb-2 mt-5 text-xs font-semibold">O elige un emoji</p><div className="grid grid-cols-7 gap-2">{["🎨","💻","🎓","🏠","💸","🧘","✨"].map(item=><Button key={item} variant={emoji===item?"emojiActive":"emoji"} size="icon" onClick={()=>setEmoji(item)}>{item}</Button>)}</div><p className="mb-2 mt-5 text-xs font-semibold">Color</p><div className="flex justify-between">{["bg-label-sapq","bg-label-uni","bg-label-twelve","bg-label-casa","bg-label-personal","bg-urgent","bg-amber"].map((item,i)=><Button key={item} variant="swatch" size="iconSm" onClick={()=>setColor(i)} className={cn(item,color===i&&"ring-2 ring-primary ring-offset-2")}/>)}</div><Button variant="default" size="lg" className="mt-6 w-full" onClick={onClose}>Crear etiqueta</Button></SheetFrame>; }