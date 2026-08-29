import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Recommendations.css";

// Curated specialist and hospital directory across major healthcare regions
const DOCTOR_DIRECTORY = [
  // ── KOLKATA SPECIALISTS ──
  {
    id: "doc-kol-1",
    name: "Dr. Ananya Mukherjee, MD, DGO",
    speciality: "Maternal-Fetal Medicine & High-Risk Obstetrics",
    hospital: "Apollo Gleneagles Hospital",
    address: "58 Canal Circular Road, Kadapara, Phool Bagan, Kolkata, WB 700054",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5697,
    lng: 88.3970,
    phone: "+91 33 2320 3040",
    experience: "16+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-kol-2",
    name: "Dr. Sourav Banerjee, DNB, MRCOG",
    speciality: "Consultant Obstetrician & Gestational Diabetes Specialist",
    hospital: "Fortis Hospital Anandapur",
    address: "730 Anandapur, EM Bypass Road, Kolkata, WB 700107",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5167,
    lng: 88.4034,
    phone: "+91 33 6628 4444",
    experience: "14+ years",
    rating: 4.8,
    recommendedFor: ["low", "moderate", "high"]
  },
  {
    id: "doc-kol-3",
    name: "Dr. Sudhir Adhikari, MD, FRCOG",
    speciality: "Senior Perinatologist & High-Risk Pregnancy Specialist",
    hospital: "Bhagirathi Neotia Woman and Child Care Centre",
    address: "2 Rawdon Street, Park Street Area, Kolkata, WB 700017",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5448,
    lng: 88.3564,
    phone: "+91 33 4040 5000",
    experience: "22+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-kol-4",
    name: "Dr. Gita Ganguly Mukherjee, MD, FICOG",
    speciality: "Senior Consultant Obstetrician & Gynecologist",
    hospital: "Woodlands Multispeciality Hospital",
    address: "8/5 Alipore Road, Alipore, Kolkata, WB 700027",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5326,
    lng: 88.3308,
    phone: "+91 33 2456 7075",
    experience: "25+ years",
    rating: 4.9,
    recommendedFor: ["low", "moderate", "high"]
  },
  {
    id: "doc-kol-5",
    name: "Dr. Basab Mukherjee, MS (OBG), FICOG, FRCPI",
    speciality: "Obstetric Medicine & Gestational Metabolic Health",
    hospital: "AMRI Hospitals Dhakuria",
    address: "JC-16 & 17, Block JC, Gariahat / Dhakuria, Kolkata, WB 700029",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5125,
    lng: 88.3685,
    phone: "+91 33 6680 0000",
    experience: "18+ years",
    rating: 4.8,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-kol-6",
    name: "Dr. Ratnabali Chakravorty, DGO, MD",
    speciality: "High-Risk Obstetrics & Fetal Well-being Specialist",
    hospital: "Bhagirathi Neotia Woman & Child Care Centre",
    address: "Premises 27-0327, Action Area IID, New Town, Kolkata, WB 700156",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5865,
    lng: 88.4752,
    phone: "+91 33 6640 5000",
    experience: "17+ years",
    rating: 4.9,
    recommendedFor: ["low", "moderate", "high"]
  },
  {
    id: "doc-kol-7",
    name: "Dr. Indranil Saha, MD, DGO, MRCOG (UK)",
    speciality: "Maternal-Fetal Specialist & Reproductive Medicine",
    hospital: "Peerless Hospital & B.K. Roy Research Centre",
    address: "360 Panchasayar, Garia / Jadavpur, Kolkata, WB 700094",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.4842,
    lng: 88.3983,
    phone: "+91 33 4011 1222",
    experience: "19+ years",
    rating: 4.8,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-kol-8",
    name: "Dr. Ranjana Chakrabarti, MD, DM (Endocrinology)",
    speciality: "Gestational Diabetes & Obstetric Endocrinologist",
    hospital: "The Calcutta Medical Research Institute (CMRI)",
    address: "7/2 Diamond Harbour Road, Ekbalpore, Kolkata, WB 700027",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5361,
    lng: 88.3275,
    phone: "+91 33 3090 3090",
    experience: "20+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-kol-9",
    name: "Dr. Sankar Das Mahapatra, MS (OBG)",
    speciality: "Senior Consultant Obstetrician & High-Risk Surgeon",
    hospital: "Medica Superspecialty Hospital",
    address: "127 Mukundapur, E.M. Bypass, Kolkata, WB 700099",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.4988,
    lng: 88.3995,
    phone: "+91 33 6652 0000",
    experience: "21+ years",
    rating: 4.8,
    recommendedFor: ["low", "moderate", "high"]
  },
  {
    id: "doc-kol-10",
    name: "Dr. Subhash Chandra Biswas, MS, DNB",
    speciality: "Professor of Obstetrics & Maternal-Fetal Unit",
    hospital: "IPGMER & SSKM Hospital",
    address: "244 AJC Bose Road, Bhowanipore, Kolkata, WB 700020",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5395,
    lng: 88.3435,
    phone: "+91 33 2223 1589",
    experience: "26+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-kol-11",
    name: "Dr. Amitabha Sengupta, DGO, MD",
    speciality: "Consultant Obstetrician & Perinatal Care",
    hospital: "Belle Vue Clinic",
    address: "9 Dr. U. N. Brahmachari St, Loudon Street area, Kolkata, WB 700017",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5458,
    lng: 88.3572,
    phone: "+91 33 2287 2321",
    experience: "23+ years",
    rating: 4.8,
    recommendedFor: ["low", "moderate"]
  },
  {
    id: "doc-kol-12",
    name: "Dr. Seetha Ramamurthy, MD, DGO",
    speciality: "Consultant Obstetrician & Gynecologist",
    hospital: "Manipal Hospital Salt Lake",
    address: "16 & 17, JC Block, Sector III, Bidhannagar, Salt Lake, Kolkata, WB 700098",
    city: "Kolkata",
    state: "West Bengal",
    lat: 22.5684,
    lng: 88.4069,
    phone: "+91 33 6680 0000",
    experience: "15+ years",
    rating: 4.8,
    recommendedFor: ["low", "moderate", "high"]
  },

  // ── BENGALURU SPECIALISTS ──
  {
    id: "doc-blr-1",
    name: "Dr. Priya Sundaram, MBBS, MS (OBG)",
    speciality: "Fetal Medicine Specialist & Perinatologist",
    hospital: "Cloudnine Hospital, Old Airport Road",
    address: "115 HAL Old Airport Rd, Kodihalli, Bengaluru, KA 560017",
    city: "Bengaluru",
    state: "Karnataka",
    lat: 12.9592,
    lng: 77.6499,
    phone: "+91 80 4555 5555",
    experience: "18+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-blr-2",
    name: "Dr. Chandrika Muralidhar, MD, DGO",
    speciality: "Consultant Obstetrician & Gestational Diabetes Care",
    hospital: "Manipal Hospital HAL Airport Road",
    address: "98 HAL Old Airport Rd, Kodihalli, Bengaluru, KA 560017",
    city: "Bengaluru",
    state: "Karnataka",
    lat: 12.9575,
    lng: 77.6490,
    phone: "+91 80 2502 4444",
    experience: "20+ years",
    rating: 4.9,
    recommendedFor: ["low", "moderate", "high"]
  },

  // ── MUMBAI SPECIALISTS ──
  {
    id: "doc-mum-1",
    name: "Dr. Rohan Deshmukh, MD, DM (Endocrinology)",
    speciality: "Consultant Diabetologist & Obstetric Endocrinologist",
    hospital: "Hinduja Healthcare Surgical",
    address: "11th Road, Khar West, Mumbai, MH 400052",
    city: "Mumbai",
    state: "Maharashtra",
    lat: 19.0688,
    lng: 72.8356,
    phone: "+91 22 4510 8108",
    experience: "20+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },
  {
    id: "doc-mum-2",
    name: "Dr. Kiran Coelho, MD, DGO, FICOG",
    speciality: "Senior Consultant Obstetrician & Gynecologist",
    hospital: "Lilavati Hospital & Research Centre",
    address: "A-791 Bandra Reclamation, Bandra West, Mumbai, MH 400050",
    city: "Mumbai",
    state: "Maharashtra",
    lat: 19.0515,
    lng: 72.8290,
    phone: "+91 22 2675 1000",
    experience: "28+ years",
    rating: 4.9,
    recommendedFor: ["low", "moderate", "high"]
  },

  // ── NEW DELHI / NCR SPECIALISTS ──
  {
    id: "doc-del-1",
    name: "Dr. Neha Verma, MS (OBG), FICOG",
    speciality: "Consultant Obstetrician & Gynecologist",
    hospital: "Max Super Speciality Hospital, Saket",
    address: "1 2, Press Enclave Marg, Saket, New Delhi, DL 110017",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.5284,
    lng: 77.2115,
    phone: "+91 11 2651 5050",
    experience: "12+ years",
    rating: 4.7,
    recommendedFor: ["low", "moderate"]
  },
  {
    id: "doc-del-2",
    name: "Dr. Anuradha Kapur, MD, FICOG",
    speciality: "Senior Director & High-Risk Pregnancy Specialist",
    hospital: "Max Multi Speciality Centre, Panchsheel Park",
    address: "N 110, Panchsheel Park, New Delhi, DL 110017",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.5441,
    lng: 77.2163,
    phone: "+91 11 4609 7200",
    experience: "26+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },

  // ── HYDERABAD SPECIALISTS ──
  {
    id: "doc-hyd-1",
    name: "Dr. Kavita Reddy, MD (OBG)",
    speciality: "Maternal Health & High-Risk Pregnancy Consultant",
    hospital: "Apollo Cradle & Children's Hospital",
    address: "Road No. 10, Banjara Hills, Hyderabad, TS 500034",
    city: "Hyderabad",
    state: "Telangana",
    lat: 17.4243,
    lng: 78.4485,
    phone: "+91 40 4424 4424",
    experience: "15+ years",
    rating: 4.8,
    recommendedFor: ["low", "moderate", "high"]
  },
  {
    id: "doc-hyd-2",
    name: "Dr. Manjula Anagani, MD, FICOG",
    speciality: "Chief Obstetrician & Clinical Director",
    hospital: "Care Hospitals, Banjara Hills",
    address: "Road No. 1, Banjara Hills, Hyderabad, TS 500034",
    city: "Hyderabad",
    state: "Telangana",
    lat: 17.4156,
    lng: 78.4498,
    phone: "+91 40 6165 6565",
    experience: "24+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  },

  // ── CHENNAI SPECIALISTS ──
  {
    id: "doc-chn-1",
    name: "Dr. Meenakshi Sundaram, MS, DGO",
    speciality: "Senior Consultant Obstetrician & Diabetologist",
    hospital: "Motherhood Hospital, T. Nagar",
    address: "542 TTK Road, Alwarpet, Chennai, TN 600018",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0336,
    lng: 80.2520,
    phone: "+91 44 4858 8888",
    experience: "19+ years",
    rating: 4.9,
    recommendedFor: ["low", "moderate", "high"]
  },
  {
    id: "doc-chn-2",
    name: "Dr. Jaishree Gajaraj, MD, DGO",
    speciality: "Senior Consultant Maternal-Fetal Care",
    hospital: "Apollo Cradle, Greams Road",
    address: "21 Greams Lane, Thousand Lights, Chennai, TN 600006",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0604,
    lng: 80.2518,
    phone: "+91 44 2829 0200",
    experience: "27+ years",
    rating: 4.9,
    recommendedFor: ["high", "moderate"]
  }
];

// Major city reference center coordinates for baseline distance calculation
const CITY_CENTERS = {
  "Kolkata":   { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
  "Bengaluru": { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  "Mumbai":    { lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
  "New Delhi": { lat: 28.6139, lng: 77.2090, state: "Delhi" },
  "Hyderabad": { lat: 17.3850, lng: 78.4867, state: "Telangana" },
  "Chennai":   { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
};

// Haversine distance calculator in KM
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function Recommendations({ result, formData, inline = false }) {
  const { profile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("exercise");
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, locating, located, error
  
  // Default to profile city if available, otherwise default to Kolkata for instant local suggestions
  const initialCity = profile?.city && profile.city.trim() ? profile.city.trim() : "Kolkata";
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [searchQuery, setSearchQuery] = useState("");

  const gdmScore = result?.gdm ?? 0;
  const riskTier = gdmScore < 30 ? "low" : gdmScore < 60 ? "moderate" : "high";

  // Request browser geolocation
  function detectLocation() {
    if (!navigator.geolocation) {
      toast.warning("Geolocation is not supported by your browser.");
      setLocationStatus("error");
      return;
    }
    setLocationStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setLocationStatus("located");

        // Check if user is closest to Kolkata or another city
        let closestCity = "Kolkata";
        let minCityDist = 999999;
        Object.entries(CITY_CENTERS).forEach(([cityName, cCoords]) => {
          const d = parseFloat(calcDistance(coords.lat, coords.lng, cCoords.lat, cCoords.lng));
          if (d < minCityDist) {
            minCityDist = d;
            closestCity = cityName;
          }
        });

        // If user is within 150 km of that city, auto-set selectedCity
        if (minCityDist < 150) {
          setSelectedCity(closestCity);
          toast.success(`📍 Located near ${closestCity}! Showing nearest clinics first.`);
        } else {
          toast.success("Location detected! Sorted by exact distance.");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocationStatus("error");
        toast.info("Using city filter for location matching.");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  // Reference coordinates for distance calculation: either exact GPS or selected city center
  const activeRefCoords = userLocation || (selectedCity !== "All Cities" && CITY_CENTERS[selectedCity] ? CITY_CENTERS[selectedCity] : null);

  // Filter & sort doctors
  const filteredDoctors = DOCTOR_DIRECTORY.map(doc => {
    let dist = null;
    if (activeRefCoords) {
      dist = calcDistance(activeRefCoords.lat, activeRefCoords.lng, doc.lat, doc.lng);
    }
    return { ...doc, distanceKm: dist ? parseFloat(dist) : null };
  }).filter(doc => {
    if (selectedCity !== "All Cities" && selectedCity !== "") {
      const matchCity = doc.city.toLowerCase().includes(selectedCity.toLowerCase());
      const matchState = doc.state.toLowerCase().includes(selectedCity.toLowerCase());
      if (!matchCity && !matchState) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = doc.name.toLowerCase().includes(q) ||
                        doc.hospital.toLowerCase().includes(q) ||
                        doc.speciality.toLowerCase().includes(q) ||
                        doc.address.toLowerCase().includes(q) ||
                        doc.city.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    return true;
  }).sort((a, b) => {
    // If distance is available, sort nearest first
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    // If city is matched, prioritize recommended tier
    const aRec = a.recommendedFor.includes(riskTier) ? 1 : 0;
    const bRec = b.recommendedFor.includes(riskTier) ? 1 : 0;
    return bRec - aRec;
  });

  return (
    <div className="recs-container">
      {/* ── Risk Summary Header ── */}
      <div className={`recs-risk-summary ${riskTier}`}>
        <div>
          <div className="recs-risk-title">
            {riskTier === "low" && "🟢 Low GDM Risk Plan (Preventive & Active)"}
            {riskTier === "moderate" && "🟡 Moderate GDM Risk Plan (Glycemic Control & Structured Monitoring)"}
            {riskTier === "high" && "🔴 High GDM Risk Protocol (Specialist Care & Medical Supervision)"}
          </div>
          <div className="recs-risk-desc">
            Tailored exercise, diet, and clinical specialist matching for your {gdmScore}% risk score.
          </div>
        </div>
        <span className={`risk-badge risk-${riskTier}`}>
          {riskTier.toUpperCase()} RISK TIER
        </span>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="recs-nav">
        <button
          className={`recs-nav-btn ${activeTab === "exercise" ? "active" : ""}`}
          onClick={() => setActiveTab("exercise")}
        >
          🏃‍♀️ Exercise &amp; Activity
          <span className="recs-badge" style={{background: "#e0f2fe", color: "#0369a1"}}>
            {riskTier === "high" ? "Gentle Only" : "Daily Active"}
          </span>
        </button>
        <button
          className={`recs-nav-btn ${activeTab === "diet" ? "active" : ""}`}
          onClick={() => setActiveTab("diet")}
        >
          🥗 Nutrition &amp; Diet
          <span className="recs-badge" style={{background: "#d1fae5", color: "#065f46"}}>
            Low GI
          </span>
        </button>
        <button
          className={`recs-nav-btn ${activeTab === "doctor" ? "active" : ""}`}
          onClick={() => setActiveTab("doctor")}
        >
          🩺 Doctor &amp; Clinic Match
          <span className="recs-badge" style={{background: "#fef3c7", color: "#92400e"}}>
            {filteredDoctors.length} Specialists
          </span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: EXERCISE & PHYSICAL ACTIVITY                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "exercise" && (
        <div>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:".5rem",marginBottom:".75rem"}}>
            <h3 style={{margin:0,color:"var(--navy)"}}>Personalized Activity Regimen</h3>
            <span style={{fontSize:".85rem",color:"var(--muted)"}}>
              Target: {riskTier === "low" ? "150 min/week" : riskTier === "moderate" ? "20-30 min post-meal" : "Supervised gentle stretches"}
            </span>
          </div>

          {/* High risk strict warning */}
          {riskTier === "high" && (
            <div className="red-flag-box" style={{marginBottom:"1.25rem"}}>
              <div className="red-flag-title">
                ⚠️ Obstetrician Clearance Mandatory Before Exercise
              </div>
              <p style={{fontSize:".85rem",lineHeight:1.5}}>
                Due to elevated glycemic or metabolic indicators, please consult your OB-GYN or Maternal-Fetal Specialist before undertaking new exercise regimens. Stick strictly to slow strolls and diaphragmatic breathing until cleared.
              </p>
            </div>
          )}

          <div className="exercise-grid">
            {riskTier === "low" && (
              <>
                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🚶‍♀️</div>
                    <div>
                      <div className="ex-title">Brisk Walking</div>
                      <div className="ex-meta">30 Mins · 5 Days / Week</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Improves maternal cardiovascular efficiency and insulin sensitivity without stressing joints.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Maintain conversational pace (talk test)</li>
                    <li>Wear well-cushioned supportive footwear</li>
                    <li>Stay hydrated with electrolytes</li>
                  </ul>
                </div>

                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🧘‍♀️</div>
                    <div>
                      <div className="ex-title">Prenatal Yoga &amp; Pelvic Floor</div>
                      <div className="ex-meta">20-30 Mins · 3-4 Days / Week</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Enhances pelvic flexibility, strengthens perineal muscles (Kegels), and reduces lower back strain.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Focus on gentle butterfly pose &amp; cat-cow stretch</li>
                    <li>Avoid lying flat on your back after week 16</li>
                    <li>Practice deep diaphragmatic belly breathing</li>
                  </ul>
                </div>

                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🏊‍♀️</div>
                    <div>
                      <div className="ex-title">Swimming &amp; Water Aerobics</div>
                      <div className="ex-meta">30 Mins · 2-3 Days / Week</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Buoyancy relieves spinal pressure and sciatic nerve compression while delivering a full-body workout.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Swim in moderate temperature pools</li>
                    <li>Avoid hot tubs and saunas</li>
                    <li>Use gentle breaststroke or flutter kicks</li>
                  </ul>
                </div>
              </>
            )}

            {riskTier === "moderate" && (
              <>
                <div className="exercise-card" style={{borderLeft:"4px solid var(--teal)"}}>
                  <div className="ex-card-header">
                    <div className="ex-icon-box">⏱️</div>
                    <div>
                      <div className="ex-title">Post-Meal Glycemic Walks</div>
                      <div className="ex-meta">15-20 Mins · Within 30 Mins of Meals</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Clinically proven to blunt postprandial blood glucose spikes by activating GLUT4 transporters in muscles.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Take a light walk after lunch and dinner</li>
                    <li>Keep pace relaxed to moderate</li>
                    <li>Check blood glucose 1 hour post meal to track drop</li>
                  </ul>
                </div>

                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🚴‍♀️</div>
                    <div>
                      <div className="ex-title">Stationary Recumbent Bike</div>
                      <div className="ex-meta">20 Mins · Low Resistance</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Safe non-weight-bearing aerobic exercise that eliminates tipping or fall hazards.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Keep seat adjusted to support lumbar spine</li>
                    <li>Set resistance to low-moderate level</li>
                    <li>Stop immediately if feeling fatigued</li>
                  </ul>
                </div>

                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🧘</div>
                    <div>
                      <div className="ex-title">Modified Prenatal Pilates</div>
                      <div className="ex-meta">20 Mins · 3 Days / Week</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Core stabilization and pelvic floor conditioning with pregnancy-safe props and bolsters.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Use resistance bands and yoga blocks</li>
                    <li>Avoid any abdominal crunches or compression</li>
                    <li>Keep glucose candy or tablets in reach</li>
                  </ul>
                </div>
              </>
            )}

            {riskTier === "high" && (
              <>
                <div className="exercise-card" style={{borderLeft:"4px solid #ef4444"}}>
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🛋️</div>
                    <div>
                      <div className="ex-title">Seated Mobility &amp; Stretches</div>
                      <div className="ex-meta">10-15 Mins · Low Exertion</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Non-strenuous seated upper body circles, ankle rotations, and gentle neck mobility to stimulate circulation.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Perform while seated comfortably on a sturdy chair</li>
                    <li>Ankle pumps to prevent lower leg edema</li>
                    <li>Never hold your breath (avoid Valsalva maneuver)</li>
                  </ul>
                </div>

                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🫁</div>
                    <div>
                      <div className="ex-title">Diaphragmatic Breathing &amp; Relaxation</div>
                      <div className="ex-meta">10 Mins · Morning &amp; Night</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Lowers cortisol and sympathetic stress, aiding blood pressure and metabolic stabilization.
                  </div>
                  <ul className="ex-tips-list">
                    <li>4-second inhale through nose, 6-second slow exhale</li>
                    <li>Promotes optimal oxygenation for fetus</li>
                    <li>Reduces maternal heart rate and anxiety</li>
                  </ul>
                </div>

                <div className="exercise-card">
                  <div className="ex-card-header">
                    <div className="ex-icon-box">🚶</div>
                    <div>
                      <div className="ex-title">Gentle Indoor Shuffling / Pacing</div>
                      <div className="ex-meta">5-10 Mins as Tolerated</div>
                    </div>
                  </div>
                  <div className="ex-desc">
                    Slow, restful indoor walking on even flat surfaces to keep blood moving and prevent deep vein thrombosis.
                  </div>
                  <ul className="ex-tips-list">
                    <li>Walk only in a well-ventilated, cool room</li>
                    <li>Rest with legs elevated afterwards</li>
                    <li>Stop immediately if any discomfort arises</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Red Flag Emergency Checklist */}
          <div className="red-flag-box">
            <div className="red-flag-title">
              🚨 Universal Warning Signs to Stop Exercise Immediately:
            </div>
            <div className="red-flag-items">
              <div className="red-flag-chip">Vaginal Bleeding or Spotting</div>
              <div className="red-flag-chip">Painful Uterine Contractions</div>
              <div className="red-flag-chip">Dizziness, Faintness or Blurred Vision</div>
              <div className="red-flag-chip">Amniotic Fluid Leakage</div>
              <div className="red-flag-chip">Chest Pain or Rapid Palpitations</div>
              <div className="red-flag-chip">Severe Calf Swelling or Unilateral Pain</div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: NUTRITION & DIETARY GUIDANCE                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "diet" && (
        <div>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:".5rem",marginBottom:".75rem"}}>
            <h3 style={{margin:0,color:"var(--navy)"}}>Maternal Glycemic Nutrition Guide</h3>
            <span style={{fontSize:".85rem",color:"var(--teal-dark)",fontWeight:600}}>
              Focus: Stable Blood Sugar &amp; Optimal Fetal Growth
            </span>
          </div>

          {/* The Plate Method Visualizer */}
          <div className="plate-method-box">
            <div className="plate-method-header">
              🍽️ The Maternal Diabetes Plate Method
            </div>
            <p style={{fontSize:".85rem",color:"var(--slate)",marginBottom:"1rem"}}>
              For lunch and dinner, balance your plate using these clinical proportions to prevent blood glucose spikes:
            </p>
            <div className="plate-visual">
              <div className="plate-half">
                🥬 50% Non-Starchy Vegetables &amp; Fiber
                <div style={{fontSize:".75rem",fontWeight:400,marginTop:".25rem",color:"#047857"}}>
                  Spinach (Palak), Methi, Broccoli, Cucumbers, Gourds (Lauki/Turai), Bell Peppers, Salad Greens
                </div>
              </div>
              <div className="plate-quarter-1">
                🍗 25% Lean Protein
                <div style={{fontSize:".75rem",fontWeight:400,marginTop:".25rem",color:"#0284c7"}}>
                  Sprouted Moong, Paneer, Boiled Eggs, Skinless Chicken, Tofu, Lentils (Dal)
                </div>
              </div>
              <div className="plate-quarter-2">
                🌾 25% Complex Low-GI Carbs
                <div style={{fontSize:".75rem",fontWeight:400,marginTop:".25rem",color:"#b45309"}}>
                  Brown/Hand-pounded Rice, Whole Wheat Roti, Ragi/Jowar, Steel-cut Oats, Quinoa
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Diet Recommendations Grid */}
          <div className="diet-grid">
            <div className="diet-card">
              <div className="diet-card-title">
                <span>🌾</span> Complex Low-GI Carbohydrates
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Whole Millets &amp; Multi-grains</div>
                <div className="diet-item-detail">Ragi, Jowar, Bajra, and Foxtail millet release glucose slowly into the bloodstream.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Steel-cut or Rolled Oats</div>
                <div className="diet-item-detail">Rich in beta-glucan soluble fiber that reduces morning fasting spikes.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Hand-pounded / Brown Basmati</div>
                <div className="diet-item-detail">Limit portion to 1 small bowl; pair with double the quantity of dal and vegetables.</div>
              </div>
            </div>

            <div className="diet-card">
              <div className="diet-card-title">
                <span>🥑</span> Healthy Fats &amp; Proteins
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Nuts &amp; Seeds Blend</div>
                <div className="diet-item-detail">Handful of soaked almonds, walnuts (rich in Omega-3 for fetal brain development), and chia seeds.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Lean Bioavailable Proteins</div>
                <div className="diet-item-detail">Sprouted legumes, boiled eggs, unsweetened Greek yogurt (curd) provide essential amino acids.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Cold-Pressed Oils</div>
                <div className="diet-item-detail">Extra virgin olive oil, cold-pressed mustard or groundnut oil; moderate pure cow ghee.</div>
              </div>
            </div>

            <div className="diet-card">
              <div className="diet-card-title">
                <span>🕒</span> Meal Timing &amp; Hydration
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Small Frequent Meals</div>
                <div className="diet-item-detail">3 moderate meals + 2-3 healthy snacks spaced 2.5-3 hours apart. Never fast or skip breakfast.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Hydration Protocol</div>
                <div className="diet-item-detail">Target 2.5 to 3 Liters of water daily. Add lemon slices or mint for natural flavor.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name">Bedtime Protein Snack</div>
                <div className="diet-item-detail">A small cup of warm unsweetened milk with turmeric or a boiled egg prevents the Dawn Phenomenon.</div>
              </div>
            </div>

            <div className="diet-card" style={{border:"1.5px solid #fecaca",background:"#fffafb"}}>
              <div className="diet-card-title" style={{color:"#dc2626"}}>
                <span>🚫</span> Foods to Strictly Limit or Avoid
              </div>
              <div className="diet-item">
                <div className="diet-item-name" style={{color:"#b91c1c"}}>Refined Flour &amp; Sugars</div>
                <div className="diet-item-detail">Maida, white bread, pastries, sweets (mithai), packaged breakfast cereals.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name" style={{color:"#b91c1c"}}>Liquid Sugars &amp; Fruit Juices</div>
                <div className="diet-item-detail">Packaged juices, carbonated beverages, sugary teas/coffees trigger rapid glucose spikes.</div>
              </div>
              <div className="diet-item">
                <div className="diet-item-name" style={{color:"#b91c1c"}}>High-GI Tropical Fruits in Excess</div>
                <div className="diet-item-detail">Limit mangoes, chikoo, grapes, and custard apples. Prefer apples, guavas, berries, and oranges.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: DOCTOR & SPECIALIST MATCHING                       */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "doctor" && (
        <div>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",flexWrap:"wrap",gap:".5rem",marginBottom:"1rem"}}>
            <div>
              <h3 style={{margin:0,color:"var(--navy)"}}>Maternal Specialist Directory</h3>
              <p style={{margin:"0.2rem 0 0",fontSize:".85rem",color:"var(--muted)"}}>
                Find obstetricians, perinatologists, and endocrine specialists near your location.
              </p>
            </div>

            {/* Geolocation Button */}
            <button className="location-btn" onClick={detectLocation} disabled={locationStatus === "locating"}>
              {locationStatus === "locating" ? "📡 Locating…" : "📍 Detect My Current Location"}
            </button>
          </div>

          {/* Quick City Selector Pills */}
          <div className="city-pills-row">
            <span style={{fontSize:".8rem",fontWeight:700,color:"var(--slate-600)",marginRight:".25rem"}}>Quick Filter:</span>
            {[
              { label: "📍 Kolkata (WB)", value: "Kolkata" },
              { label: "📍 Bengaluru",    value: "Bengaluru" },
              { label: "📍 New Delhi",    value: "New Delhi" },
              { label: "📍 Mumbai",       value: "Mumbai" },
              { label: "📍 Hyderabad",    value: "Hyderabad" },
              { label: "📍 Chennai",      value: "Chennai" },
              { label: "🌐 All Cities",   value: "All Cities" },
            ].map(c => (
              <button
                key={c.value}
                type="button"
                className={`city-pill-btn ${selectedCity === c.value ? "active" : ""}`}
                onClick={() => {
                  setSelectedCity(c.value);
                  setSearchQuery("");
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search and Filters Bar */}
          <div className="doc-search-bar">
            <div style={{flex:1,minWidth:220}}>
              <input
                type="text"
                placeholder="🔍 Search Kolkata hospital, doctor (e.g., Apollo, Fortis, Neotia, Alipore)…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{width:"100%",padding:".6rem .9rem",borderRadius:10,border:"1px solid var(--border)",fontFamily:"var(--font-body)",fontSize:".88rem"}}
              />
            </div>

            <div style={{minWidth:160}}>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                style={{width:"100%",padding:".6rem .9rem",borderRadius:10,border:"1px solid var(--border)",fontFamily:"var(--font-body)",fontSize:".88rem",background:"white"}}
              >
                <option value="Kolkata">Kolkata (West Bengal)</option>
                <option value="Bengaluru">Bengaluru (Karnataka)</option>
                <option value="Mumbai">Mumbai (Maharashtra)</option>
                <option value="New Delhi">New Delhi / NCR</option>
                <option value="Hyderabad">Hyderabad (Telangana)</option>
                <option value="Chennai">Chennai (Tamil Nadu)</option>
                <option value="All Cities">All Cities (All India)</option>
              </select>
            </div>

            {locationStatus === "located" && (
              <span className="location-status-badge">
                ✅ Live GPS Sorted (Nearest First)
              </span>
            )}
            {locationStatus !== "located" && selectedCity !== "All Cities" && (
              <span className="location-status-badge" style={{color:"var(--teal-dark)"}}>
                📍 {selectedCity}: {filteredDoctors.length} Specialists Available
              </span>
            )}
          </div>

          {/* High risk prompt */}
          {riskTier === "high" && (
            <div className="red-flag-box" style={{marginBottom:"1.25rem"}}>
              <div className="red-flag-title">
                🚨 Urgent Specialist Consultation Recommended
              </div>
              <p style={{fontSize:".85rem",lineHeight:1.5}}>
                Given your assessment score ({gdmScore}%), we advise scheduling an in-person or teleconsultation with a Maternal-Fetal Medicine (MFM) specialist or Diabetologist within <strong>24 to 48 hours</strong>.
              </p>
            </div>
          )}

          {/* Doctor Cards Grid */}
          <div className="doctor-cards-list">
            {filteredDoctors.length === 0 ? (
              <div className="card" style={{gridColumn:"1/-1",textAlign:"center",padding:"2rem"}}>
                <div style={{fontSize:"2rem",marginBottom:".5rem"}}>🏥</div>
                <p style={{color:"var(--muted)"}}>No clinics matching your filter. Try selecting "All Cities" or searching for a hospital.</p>
                <button className="btn btn-secondary" onClick={() => { setSelectedCity("All Cities"); setSearchQuery(""); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredDoctors.map(doc => {
                const isRecommended = doc.recommendedFor.includes(riskTier);
                return (
                  <div key={doc.id} className="doctor-card">
                    <div>
                      <div className="doc-card-top">
                        <div className="doc-avatar">
                          {doc.name.split(" ")[1]?.charAt(0) || "D"}
                        </div>
                        <div className="doc-info">
                          <div className="doc-name">{doc.name}</div>
                          <div className="doc-spec">{doc.speciality}</div>
                          <div className="doc-hospital">🏥 {doc.hospital}</div>
                          <div style={{fontSize:".75rem",color:"var(--muted)",marginTop:".2rem"}}>
                            📍 {doc.address}
                          </div>
                        </div>
                      </div>

                      {isRecommended && (
                        <div style={{marginTop:".75rem",display:"inline-block",padding:".2rem .6rem",borderRadius:6,background:"#f0fdfa",color:"var(--teal-dark)",fontSize:".75rem",fontWeight:700}}>
                          ⭐ Recommended for {riskTier.toUpperCase()} risk profiles
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="doc-meta-row">
                        <div>
                          {doc.distanceKm !== null ? (
                            <span className="doc-dist">📍 {doc.distanceKm} km away</span>
                          ) : (
                            <span style={{color:"var(--muted)"}}>📍 {doc.city}, {doc.state}</span>
                          )}
                        </div>
                        <div className="doc-rating">
                          ⭐ {doc.rating} ({doc.experience})
                        </div>
                      </div>

                      <div className="doc-actions" style={{marginTop:".75rem"}}>
                        <a href={`tel:${doc.phone.replace(/[^0-9+]/g, '')}`} className="doc-action-btn primary">
                          📞 Call Clinic
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.hospital + " " + doc.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="doc-action-btn outline"
                        >
                          🗺️ View Map
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Medical Disclaimer ── */}
      <div className="disclaimer-footer">
        <strong>⚠️ Clinical Disclaimer:</strong> SPARSHA.AI provides automated risk stratification and evidence-based educational insights. It does not replace individualized clinical judgment, laboratory Oral Glucose Tolerance Testing (OGTT), or obstetric medical nutrition therapy (MNT). Please consult your primary healthcare provider before making significant dietary or exercise modifications.
      </div>
    </div>
  );
}
