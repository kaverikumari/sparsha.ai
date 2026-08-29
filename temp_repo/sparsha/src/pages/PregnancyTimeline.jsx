import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./PregnancyTimeline.css";

// Week-by-week data — trimester grouped
const WEEKS = [
  // T1
  { week:4,  tri:1, size:"Poppy seed",  sizeEmoji:"🌱", highlight:"Implantation complete. HCG rising.", symptoms:["Mild cramping","Breast tenderness","Fatigue"], tip:"Start folic acid 400mcg daily if not already." },
  { week:6,  tri:1, size:"Lentil",      sizeEmoji:"🫘", highlight:"Heartbeat detectable by ultrasound.", symptoms:["Morning nausea","Food aversions","Frequent urination"], tip:"Stay hydrated. Small frequent meals help nausea." },
  { week:8,  tri:1, size:"Raspberry",   sizeEmoji:"🫐", highlight:"All major organs forming.", symptoms:["Nausea peaks","Fatigue","Mood changes"], tip:"Book your first prenatal appointment." },
  { week:10, tri:1, size:"Strawberry",  sizeEmoji:"🍓", highlight:"Fingers and toes forming.", symptoms:["Round ligament pain begins","Bloating"], tip:"Avoid raw fish and unpasteurized cheese." },
  { week:12, tri:1, size:"Lime",        sizeEmoji:"🟢", highlight:"End of first trimester. Miscarriage risk drops significantly.", symptoms:["Nausea beginning to ease","Visible bump starting"], tip:"NT scan typically done this week." },
  // T2
  { week:16, tri:2, size:"Avocado",     sizeEmoji:"🥑", highlight:"Baby can hear sounds now.", symptoms:["Reduced nausea","More energy","Back aches"], tip:"Quad screen blood test around this time." },
  { week:20, tri:2, size:"Banana",      sizeEmoji:"🍌", highlight:"Anatomy scan — can find out baby's sex.", symptoms:["Kicks becoming noticeable","Heartburn","Leg cramps"], tip:"Start kick counting after week 24." },
  { week:24, tri:2, size:"Ear of corn", sizeEmoji:"🌽", highlight:"Baby is viable outside the womb.", symptoms:["Braxton Hicks begin","Swollen feet","Stretch marks"], tip:"GDM screening (OGTT) done between weeks 24–28." },
  { week:28, tri:2, size:"Eggplant",    sizeEmoji:"🍆", highlight:"Baby opens eyes for first time.", symptoms:["Shortness of breath","Frequent urination returns","Pelvic pressure"], tip:"Count kicks daily — 10 in 2 hours is normal." },
  // T3
  { week:32, tri:3, size:"Squash",      sizeEmoji:"🎃", highlight:"Baby practicing breathing movements.", symptoms:["Strong kicks","Back pain","Difficulty sleeping"], tip:"Attend childbirth preparation classes." },
  { week:36, tri:3, size:"Romaine lettuce", sizeEmoji:"🥬", highlight:"Baby considered early term.", symptoms:["Pelvic pressure increases","Nesting instinct","Colostrum leaking"], tip:"Hospital bag should be packed." },
  { week:38, tri:3, size:"Leek",        sizeEmoji:"🌿", highlight:"Lungs fully mature.", symptoms:["Cervix softening","Strong Braxton Hicks","Pelvic lightening"], tip:"Know the signs of labour: regular contractions, water breaking." },
  { week:40, tri:3, size:"Watermelon",  sizeEmoji:"🍉", highlight:"Full term! Baby ready to meet you.", symptoms:["Cervix dilating","Mucus plug may pass","Contractions"], tip:"Contact your doctor if no labour by week 41." },
];

const TRI_LABELS = { 1: "First Trimester", 2: "Second Trimester", 3: "Third Trimester" };
const TRI_COLORS = { 1: "#f0fdfa", 2: "#eff6ff", 3: "#fdf4ff" };
const TRI_ACCENT = { 1: "var(--teal)", 2: "#3b82f6", 3: "#a855f7" };

export default function PregnancyTimeline({ demo }) {
  const { profile } = useAuth();
  const currentWeek = +(profile?.pregnancyWeek || 0);
  const [selected, setSelected] = useState(
    WEEKS.find(w => w.week >= currentWeek) || WEEKS[WEEKS.length - 1]
  );

  const grouped = [1,2,3].map(tri => ({
    tri, label: TRI_LABELS[tri],
    weeks: WEEKS.filter(w => w.tri === tri),
  }));

  return (
    <div className="dash-section">
      <h1 className="section-title">Pregnancy Timeline 🗓️</h1>
      <p className="section-sub" style={{marginBottom:"1.75rem"}}>
        Week-by-week guide to your pregnancy journey — symptoms, baby size, and tips.
        {currentWeek > 0 && <strong> You are currently at week {currentWeek}.</strong>}
      </p>

      <div className="pt-layout">
        {/* ── Left: week selector ── */}
        <div className="pt-sidebar">
          {grouped.map(g => (
            <div key={g.tri} className="pt-tri-group">
              <div className="pt-tri-label" style={{color:TRI_ACCENT[g.tri]}}>{g.label}</div>
              {g.weeks.map(w => {
                const isCurrent = currentWeek > 0 && currentWeek >= w.week &&
                  (WEEKS[WEEKS.indexOf(w)+1]?.week > currentWeek || WEEKS.indexOf(w) === WEEKS.length-1);
                return (
                  <button key={w.week}
                    className={`pt-week-btn ${selected.week===w.week?"act":""} ${isCurrent?"current":""}`}
                    onClick={() => setSelected(w)}>
                    <span className="pt-week-emoji">{w.sizeEmoji}</span>
                    <span>Week {w.week}</span>
                    {isCurrent && <span className="pt-you-badge">← You</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Right: detail card ── */}
        <div className="card pt-detail" style={{background:TRI_COLORS[selected.tri]}}>
          <div className="pt-detail-top">
            <div className="pt-week-big" style={{color:TRI_ACCENT[selected.tri]}}>Week {selected.week}</div>
            <div className="pt-size-badge">
              <span style={{fontSize:"2.5rem"}}>{selected.sizeEmoji}</span>
              <div>
                <div style={{fontSize:".72rem",color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em"}}>Baby is about the size of a</div>
                <div style={{fontWeight:700,fontSize:"1.05rem"}}>{selected.size}</div>
              </div>
            </div>
          </div>

          <div className="pt-highlight" style={{borderColor:TRI_ACCENT[selected.tri]}}>
            ✨ {selected.highlight}
          </div>

          <div className="pt-section-head">Common Symptoms This Week</div>
          <div className="pt-symptoms">
            {selected.symptoms.map((s,i) => (
              <div key={i} className="pt-symptom-chip">{s}</div>
            ))}
          </div>

          <div className="pt-section-head">💡 Tip</div>
          <div className="pt-tip">{selected.tip}</div>

          {/* GDM relevance callout for week 24-28 */}
          {selected.week >= 24 && selected.week <= 28 && (
            <div className="pt-gdm-callout">
              <div style={{fontWeight:700,marginBottom:".35rem"}}>🧪 GDM Screening Window</div>
              <div style={{fontSize:".85rem"}}>
                Weeks 24–28 are when your doctor will order the Oral Glucose Tolerance Test (OGTT) 
                to screen for Gestational Diabetes. Use SPARSHA.AI's assessment to track your risk before the test.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}