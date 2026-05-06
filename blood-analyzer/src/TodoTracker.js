import { useState, useEffect, useCallback } from "react";
import "./TodoTracker.css";

const DAYS        = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEAL_LABELS = { bf: "Breakfast", lu: "Lunch", sn: "Snacks", di: "Dinner" };
const CAT_LABELS  = { meal: "Meal", exercise: "Exercise", hydration: "Hydration", sleep: "Sleep" };
const CIRCUMFERENCE = 2 * Math.PI * 34;

function getTodayIndex() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function TodoTracker() {
  const todayIdx  = getTodayIndex();
  const todayName = DAYS[todayIdx];

  const [tasksByDay,     setTasksByDay]     = useState({});
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx);
  const [filter,         setFilter]         = useState("all");
  const [loading,        setLoading]        = useState(true);
  const [noData,         setNoData]         = useState(false);
  const [water,          setWater]          = useState("");
  const [sleep,          setSleep]          = useState("");
  const [waterId,        setWaterId]        = useState(null);
  const [sleepId,        setSleepId]        = useState(null);
  const [userFood,       setUserFood]       = useState("");

  const buildTasksByDay = useCallback((data, foodPref) => {
    const byDay = {};
    for (const day of DAYS) {
      const isPast   = DAYS.indexOf(day) < todayIdx;
      const isToday  = day === todayName;
      const dayDiet     = data.diet.filter(d => d.day === day);
      const dayExercise = data.exercise.filter(e => e.day === day);

      byDay[day] = [
        ...dayDiet.map(d => ({
          id:        `diet-${d.id}`,
          title:     d.food,
          category:  "meal",
          meta:      MEAL_LABELS[d.meal_time] || d.meal_time,
          completed: !!d.completed,
        })),
        ...dayExercise.map(e => ({
          id:        `ex-${e.id}`,
          title:     e.exercise,
          category:  "exercise",
          meta:      "Today",
          completed: !!e.completed,
        })),
        data.water ? {
          id:        `water-${data.water.id}`,
          title:     `Drink ${data.water.water}`,
          category:  "hydration",
          meta:      "Throughout the day",
          completed: isToday ? !!data.water.completed : false,
        } : null,
        data.sleep ? {
          id:        `sleep-${data.sleep.id}`,
          title:     `Sleep at least ${data.sleep.sleep_hour} hours`,
          category:  "sleep",
          meta:      "Tonight",
          completed: isToday ? !!data.sleep.completed : false,
        } : null,
      ].filter(Boolean);
    }
    return byDay;
  }, [todayIdx, todayName]);

  const loadTracker = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:5000/get-tracker", { credentials: "include" }),
      fetch("http://localhost:5000/profile",     { credentials: "include" }),
    ])
      .then(async ([trackerRes, profileRes]) => {
        if (trackerRes.status === 401) { setNoData(true); setLoading(false); return; }

        const [trackerData, profileData] = await Promise.all([
          trackerRes.json(),
          profileRes.ok ? profileRes.json() : Promise.resolve({}),
        ]);

        const foodPref = profileData.diet_preference || "";
        setUserFood(foodPref);

        if (!trackerData.hasData) { setNoData(true); setLoading(false); return; }

        setWater(trackerData.water?.water      || "");
        setSleep(trackerData.sleep?.sleep_hour || "");
        setWaterId(trackerData.water?.id        ?? null);
        setSleepId(trackerData.sleep?.id        ?? null);
        setTasksByDay(buildTasksByDay(trackerData, foodPref));
        setLoading(false);
      })
      .catch(() => { setNoData(true); setLoading(false); });
  }, [buildTasksByDay]);

  useEffect(() => { loadTracker(); }, [loadTracker]);

  useEffect(() => {
    const handler = () => loadTracker();
    window.addEventListener("profileUpdated", handler);
    return () => window.removeEventListener("profileUpdated", handler);
  }, [loadTracker]);

  const toggle = async (id) => {
    const task = (tasksByDay[todayName] || []).find(t => t.id === id);
    if (!task) return;
    const nowCompleted = !task.completed;

    setTasksByDay(prev => {
      const updated = {};
      for (const day of DAYS) {
        updated[day] = (prev[day] || []).map(t =>
          t.id === id ? { ...t, completed: nowCompleted } : t
        );
      }
      return updated;
    });

    try {
      if (id.startsWith("water-") || id.startsWith("sleep-")) {
        const type  = id.startsWith("water-") ? "water" : "sleep";
        const rowId = id.startsWith("water-") ? waterId : sleepId;
        await fetch("http://localhost:5000/toggle-water-sleep", {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
          body:        JSON.stringify({ type, id: rowId, completed: nowCompleted }),
        });
      } else {
        await fetch("http://localhost:5000/toggle-task", {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
          body:        JSON.stringify({ taskId: id, completed: nowCompleted }),
        });
      }
    } catch {
      setTasksByDay(prev => {
        const reverted = {};
        for (const day of DAYS) {
          reverted[day] = (prev[day] || []).map(t =>
            t.id === id ? { ...t, completed: !nowCompleted } : t
          );
        }
        return reverted;
      });
    }
  };

  const selectedDay = DAYS[selectedDayIdx];
  const isToday     = selectedDayIdx === todayIdx;
  const isPastDay   = selectedDayIdx < todayIdx;
  const isFutureDay = selectedDayIdx > todayIdx;

  const tasks    = tasksByDay[selectedDay] || [];
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.category === filter);

  const grouped = filtered.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});

  const viewTasks       = tasksByDay[selectedDay] || [];
  const completedCount  = viewTasks.filter(t => t.completed).length;
  const total           = viewTasks.length;
  const pct             = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const offset          = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const motivational =
    isPastDay ? (pct === 100 ? "Perfect day! All tasks completed 🎉" :
                 pct >= 50  ? `Good effort — ${pct}% completed that day` :
                              `${pct}% completed that day`) :
    isFutureDay ? "Plan ahead — get ready for this day!" :
    pct === 100 ? "All done! Amazing work today 🎉" :
    pct >= 50   ? "Over halfway there, keep going!" :
                  "Start strong — every task counts";

  if (loading) return (
    <div className="tt-root">
      <div className="tt-skeleton" />
      <div className="tt-skeleton" />
      <div className="tt-skeleton" />
    </div>
  );

  if (noData) return (
    <div className="tt-root">
      <div className="tt-empty">
        <p>🩸</p>
        <p>No plan found. Upload your blood report first to generate your health plan.</p>
      </div>
    </div>
  );

  return (
    <div className="tt-root">

      <div className="tt-day-strip">
        {DAY_LABELS.map((label, i) => {
          const isTodayPill = i === todayIdx;
          const isPast      = i < todayIdx;
          const isFuture    = i > todayIdx;
          const isSelected  = i === selectedDayIdx;
          return (
            <div
              key={label}
              className={[
                "tt-day-pill",
                isSelected  ? "tt-day-selected" : "",
                isTodayPill ? "tt-day-today"    : "",
                isPast      ? "tt-day-past"      : "",
                isFuture    ? "tt-day-future"    : "",
              ].join(" ")}
              onClick={() => setSelectedDayIdx(i)}
            >
              <span className="tt-day-name">{label}</span>
              {isTodayPill && <span className="tt-day-dot" />}
              {isPast      && <span className="tt-day-check">✓</span>}
              {isFuture    && <span className="tt-day-lock">🔒</span>}
            </div>
          );
        })}
      </div>

      {(water || sleep) && (
        <div className="tt-stats-row">
          {water    && <div className="tt-stat-pill">💧 {water}</div>}
          {sleep    && <div className="tt-stat-pill">🌙 {sleep} hrs sleep</div>}
          {userFood && (
            <div className="tt-stat-pill">
              {userFood === "Veg" ? "🥦 Vegetarian plan" : "🍗 Non-veg plan"}
            </div>
          )}
        </div>
      )}

      <div className="tt-progress-card">
        <div className="tt-ring-wrap">
          <svg viewBox="0 0 80 80" className="tt-ring-svg">
            <defs>
              <linearGradient id="ttGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#2D9D8F" />
                <stop offset="100%" stopColor="#4DB8A8" />
              </linearGradient>
            </defs>
            <circle className="tt-ring-bg"   cx="40" cy="40" r="34" />
            <circle className="tt-ring-fill" cx="40" cy="40" r="34"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="tt-ring-label">
            <span>{pct}%</span>
            <small>{isPastDay ? "done" : isFutureDay ? "planned" : "done"}</small>
          </div>
        </div>
        <div className="tt-prog-body">
          <p className="tt-prog-fraction">
            {isPastDay
              ? `${completedCount} / ${total} completed`
              : isFutureDay
              ? `${total} tasks planned`
              : `${completedCount} / ${total} tasks`}
          </p>
          <p className="tt-prog-sub">{motivational}</p>
          <div className="tt-bar-track">
            <div className="tt-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="tt-filters">
        {["all","meal","exercise","hydration","sleep"].map(cat => (
          <button
            key={cat}
            className={`tt-ftab ${filter === cat ? "tt-ftab-active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {cat === "all" ? "All" : CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="tt-task-list">
        {Object.keys(grouped).length === 0 && (
          <div className="tt-empty"><p>🌿</p><p>No tasks here</p></div>
        )}
        {Object.entries(grouped).map(([cat, catTasks]) => (
          <div key={cat}>
            <p className="tt-group-label">{CAT_LABELS[cat]}</p>
            {catTasks.map(task => {
              const clickable = isToday;
              const showDone  = task.completed;
              return (
                <div
                  key={task.id}
                  className={[
                    "tt-task",
                    clickable ? "tt-task-clickable" : "tt-task-readonly",
                    showDone  ? "tt-task-done"      : "",
                  ].join(" ")}
                  onClick={() => clickable && toggle(task.id)}
                >
                  <div className={`tt-check ${showDone ? "tt-check-done" : ""}`}>
                    {showDone && <span>✓</span>}
                  </div>
                  <span className={`tt-pip tt-pip-${task.category}`} />
                  <div className="tt-task-body">
                    <p className="tt-task-title">{task.title}</p>
                    <p className="tt-task-meta">{task.meta}</p>
                  </div>
                  <span className={`tt-chip tt-chip-${task.category}`}>
                    {CAT_LABELS[task.category]}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}