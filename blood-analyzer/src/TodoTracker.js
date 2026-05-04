import { useState, useEffect } from "react";
import "./TodoTracker.css";

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEAL_LABELS = { bf: "Breakfast", lu: "Lunch", sn: "Snacks", di: "Dinner" };
const CAT_LABELS = { meal: "Meal", exercise: "Exercise", hydration: "Hydration", sleep: "Sleep" };
const CIRCUMFERENCE = 2 * Math.PI * 34;

function getTodayIndex() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function TodoTracker() {
  const todayIdx  = getTodayIndex();
  const todayName = DAYS[todayIdx];

// State variables
  const [tasksByDay, setTasksByDay] = useState({});
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [water, setWater] = useState("");
  const [sleep, setSleep] = useState("");

useEffect(() => {
    fetch("http://localhost:5000/get-tracker", { credentials: "include" })
      .then(res => {
        // if user not logged in
        if (res.status === 401) { setNoData(true); setLoading(false); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;

        if (!data.hasData) {
          setNoData(true);
          setLoading(false);
          return;
        }

        const byDay = {};
        for (const day of DAYS) {
          const dayDiet     = data.diet.filter(d => d.day === day); //Today's data
          const dayExercise = data.exercise.filter(e => e.day === day); // Today's exercise

          //Converts each DB diet row into a unified task object
          byDay[day] = [
            ...dayDiet.map(d => ({
              id: `diet-${d.id}`,
              title: d.food,
              category: "meal",
              meta: MEAL_LABELS[d.meal_time] || d.meal_time,
              completed: !!d.completed,
            })),
            ...dayExercise.map(e => ({
              id: `ex-${e.id}`,
              title: e.exercise,
              category: "exercise",
              meta: "Today",
              completed: !!e.completed,
            })),
            data.water ? {
              id: "water-1",
              title: `Drink ${data.water.water}`,
              category: "hydration",
              meta: "Throughout the day",
              completed: false,
            } : null,
            data.sleep ? {
              id: "sleep-1",
              title: `Sleep at least ${data.sleep.sleep_hour} hours`,
              category: "sleep",
              meta: "Tonight",
              completed: false,
            } : null,
          ].filter(Boolean);
        }

        setTasksByDay(byDay);
        setWater(data.water?.water || "");
        setSleep(data.sleep?.sleep_hour || "");
        setLoading(false); //hides the skeleton loader
      })
      .catch(() => { setNoData(true); setLoading(false); });
  }, [todayName]); //closes useeffect and sets its dependency

  const toggle = async (id) => {
    const task = (tasksByDay[todayName] || []).find(t => t.id === id);
    if (!task) return;
    const nowCompleted = !task.completed;

    // Optimistic update
    setTasksByDay(prev => {
      const dayTasks = (prev[todayName] || []).map(t =>
        t.id === id ? { ...t, completed: nowCompleted } : t
      );
      return { ...prev, [todayName]: dayTasks };
    });

    // water / sleep are shared rows, no DB column to update
    if (id === "water-1" || id === "sleep-1") return;

    // diet / exercise → save to DB
    try {
      await fetch("http://localhost:5000/toggle-task", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: id, completed: nowCompleted }),
      });
    } catch {
      // Revert on failure
      setTasksByDay(prev => {
        const dayTasks = (prev[todayName] || []).map(t =>
          t.id === id ? { ...t, completed: !nowCompleted } : t
        );
        return { ...prev, [todayName]: dayTasks };
      });
    }
  };

  const selectedDay = DAYS[selectedDayIdx];
  const isToday     = selectedDayIdx === todayIdx;
  const tasks       = tasksByDay[selectedDay] || [];

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.category === filter);

  const grouped = filtered.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});

  const todayTasks     = tasksByDay[todayName] || [];
  const completedCount = todayTasks.filter(t => t.completed).length; //function which checks unchecks a task
  const total = todayTasks.length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const motivational =
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

      {/* Day strip */}
      <div className="tt-day-strip">
        {DAY_LABELS.map((label, i) => {
          const isToday  = i === todayIdx;
          const isPast   = i < todayIdx;
          const isFuture = i > todayIdx;
          const isSelected = i === selectedDayIdx;
          return (
            //{label}-  helps React track which item is which when re-rendering for list items
            <div key={label} className={[
              "tt-day-pill",
              isSelected ? "tt-day-selected" : "",
              isToday  ? "tt-day-today"  : "",
              isPast   ? "tt-day-past"   : "",
              isFuture ? "tt-day-future" : "",
            ].join(" ")}
              onClick={() => setSelectedDayIdx(i)}
              style={{ cursor: "pointer" }}
            >
              <span className="tt-day-name">{label}</span>
              {isToday  && <span className="tt-day-dot" />}
              {isPast   && <span className="tt-day-check">✓</span>}
              {isFuture && <span className="tt-day-lock">🔒</span>}
            </div>
          );
        })}
      </div>

      {/* Read-only banner when browsing other days */}
      {!isToday && (
        <div style={{
          backgroundColor: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "0.85rem",
          color: "#999",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>{selectedDayIdx < todayIdx ? "📅" : "🔒"}</span>
          <span>
            {selectedDayIdx < todayIdx
              ? `${DAY_LABELS[selectedDayIdx]} — viewing past day (read‑only)`
              : `${DAY_LABELS[selectedDayIdx]} — upcoming day (read‑only)`}
          </span>
          <button
            onClick={() => setSelectedDayIdx(todayIdx)}
            style={{
              marginLeft: "auto", padding: "4px 10px",
              borderRadius: "12px", border: "none",
              backgroundColor: "#2c5f63", color: "white",
              fontSize: "0.78rem", cursor: "pointer",
            }}
          >
            Go to Today
          </button>
        </div>
      )}

      {/* Stats row */}
      {(water || sleep) && (
        <div className="tt-stats-row">
          {water && <div className="tt-stat-pill">💧 {water}</div>}
          {sleep && <div className="tt-stat-pill">🌙 {sleep} hrs sleep</div>}
        </div>
      )}

      {/* Progress card */}
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
            <small>done</small>
          </div>
        </div>
        <div className="tt-prog-body">
          <p className="tt-prog-fraction">{completedCount} / {total} tasks</p>
          <p className="tt-prog-sub">{motivational}</p>
          <div className="tt-bar-track">
            <div className="tt-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
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

      {/* Task list */}
      <div
        className="tt-task-list"
        style={!isToday ? {
          opacity: 0.45,
          filter: "grayscale(60%)",
          pointerEvents: "none",
          userSelect: "none",
        } : {}}
      >
        {Object.keys(grouped).length === 0 && (
          <div className="tt-empty"><p>🌿</p><p>No tasks here</p></div>
        )}
        {Object.entries(grouped).map(([cat, catTasks]) => (
          <div key={cat}>
            <p className="tt-group-label">{CAT_LABELS[cat]}</p>
            {catTasks.map(task => (
              <div
                key={task.id}
                className={`tt-task ${task.completed ? "tt-task-done" : ""}`}
                onClick={() => isToday && toggle(task.id)}
                style={{ cursor: isToday ? "pointer" : "default" }}
              >
                <div className={`tt-check ${task.completed ? "tt-check-done" : ""}`}>
                  {task.completed && <span>✓</span>}
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
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}