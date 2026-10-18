import MapView from "./MapView.jsx";
import { useState, useEffect } from "react";
import "./App.css";

const navigation = [
  { id: "overview", icon: "⌂", label: "Overview", group: "WORKSPACE" },
  { id: "planner", icon: "⌁", label: "Route planner", group: "WORKSPACE" },
  { id: "compare", icon: "⇄", label: "Route intelligence", group: "WORKSPACE" },
  { id: "copilot", icon: "✳", label: "AI copilot", group: "WORKSPACE", badge: "AI" },
  { id: "traffic", icon: "◉", label: "Traffic monitor", group: "INTELLIGENCE" },
  { id: "safety", icon: "◇", label: "Road safety", group: "INTELLIGENCE" },
  { id: "saved", icon: "♡", label: "Saved places", group: "INTELLIGENCE" },
];

const initialRoutes = [
  { id: 1, from: "SRM University", to: "Chennai Central", time: "42 min", distance: "24.8 km", traffic: "Moderate", color: "cyan", note: "Best balance of time and distance" },
  { id: 2, from: "SRM University", to: "Chennai Central", time: "51 min", distance: "21.2 km", traffic: "Light", color: "purple", note: "A calmer route with fewer busy junctions" },
  { id: 3, from: "SRM University", to: "Chennai Central", time: "59 min", distance: "29.6 km", traffic: "Heavy", color: "orange", note: "More traffic near central junctions" },
];

const initialPlaces = [
  { id: 1, name: "SRM University", type: "University", address: "Kattankulathur, Tamil Nadu", icon: "⌂" },
  { id: 2, name: "Chennai Central", type: "Transit hub", address: "Park Town, Chennai", icon: "↗" },
  { id: 3, name: "Airport Terminal", type: "Airport", address: "Meenambakkam, Chennai", icon: "✈" },
];

function Icon({ children, size = 20 }) {
  return <span className="icon-glyph" style={{ fontSize: size }}>{children}</span>;
}

function Brand() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark">
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M7 29 18 8l5 10 4-6 6 17H7Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="m13 29 7-13 6 13" stroke="#9D8BFF" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="29" cy="10" r="3" fill="#63F5E6" />
        </svg>
      </div>
      <div>
        <div className="brand-name">smart<span>route</span><sup>AI</sup></div>
        <div className="brand-caption">MOVE WITH INTELLIGENCE</div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function StatCard({ icon, label, value, detail, trend, tone = "cyan" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon"><Icon size={22}>{icon}</Icon></span>
        <span className="stat-trend">{trend}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
      <div className="stat-sparkline" aria-hidden="true">
        {[25, 42, 33, 57, 39, 72, 53, 86, 66, 96, 74, 100].map((height, i) => (
          <span key={i} style={{ height: `${height}%` }} />
        ))}
      </div>
    </article>
  );
}

function MapIllustration({ large = false, route = "cyan" }) {
  return (
    <div className={`map-illustration ${large ? "map-large" : ""}`}>
      <div className="map-grid" />
      <svg className="map-roads" viewBox="0 0 800 470" preserveAspectRatio="xMidYMid slice" aria-label="Stylized city map with highlighted route">
        <defs>
          <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={route === "purple" ? "#A78BFA" : "#58F5E4"} />
            <stop offset="100%" stopColor="#8D78FF" />
          </linearGradient>
          <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="city-blocks">
          <path d="M-20 60 115 20 165 90 42 144Z" />
          <path d="M190 18 285 0 335 65 235 112Z" />
          <path d="M360 35 450 0 495 75 395 110Z" />
          <path d="M545 12 670 38 642 105 530 84Z" />
          <path d="M680 135 790 105 830 190 715 215Z" />
          <path d="M-10 190 85 154 140 226 40 270Z" />
          <path d="M175 160 275 120 325 195 230 237Z" />
          <path d="M375 145 480 112 520 184 425 222Z" />
          <path d="M560 160 650 130 700 205 605 245Z" />
          <path d="M80 310 170 267 225 340 130 380Z" />
          <path d="M270 275 370 235 425 310 320 355Z" />
          <path d="M475 265 570 225 625 300 525 345Z" />
          <path d="M670 290 760 250 820 325 720 365Z" />
          <path d="M-20 405 70 370 120 450 20 485Z" />
          <path d="M200 410 290 370 350 450 250 490Z" />
          <path d="M420 400 510 360 570 440 470 485Z" />
          <path d="M630 405 720 370 785 445 680 490Z" />
        </g>
        <g className="road-lines">
          <path d="M0 110 800 390" />
          <path d="M0 260 800 75" />
          <path d="M110 0 300 470" />
          <path d="M340 0 510 470" />
          <path d="M590 0 420 470" />
          <path d="M720 0 610 470" />
          <path d="M0 350 800 250" />
          <path d="M0 35 800 440" />
          <path d="M0 450 800 145" />
        </g>
        <path className="route-halo" d="M112 355 C155 315 205 350 245 300 S320 210 390 235 S475 295 515 225 S600 115 685 105" />
        <path className="route-line" d="M112 355 C155 315 205 350 245 300 S320 210 390 235 S475 295 515 225 S600 115 685 105" filter="url(#routeGlow)" />
        <circle className="map-pulse" cx="112" cy="355" r="12" />
        <circle className="map-pin-start" cx="112" cy="355" r="6" />
        <circle className="map-pin-end" cx="685" cy="105" r="8" />
      </svg>
      <div className="map-label map-label-start"><span className="map-label-dot" />Your location</div>
      <div className="map-label map-label-end"><span className="map-label-dot purple-dot" />Destination</div>
      <div className="map-coordinate">13.0827° N &nbsp; 80.2707° E</div>
      <div className="map-compass">N <span>↑</span></div>
      <div className="map-zoom"><button aria-label="Zoom in">+</button><button aria-label="Zoom out">−</button></div>
      <div className="map-attribution">SMARTROUTE SPATIAL ENGINE <span>•</span> DEMO MAP</div>
    </div>
  );
}

function RouteMiniMap({ color = "cyan" }) {
  return (
    <div className={`route-mini-map mini-${color}`}>
      <svg viewBox="0 0 220 92" fill="none" aria-hidden="true">
        <path d="M-10 20 230 75M30-10 85 110M140-10 112 110M190-10 160 110M-10 75 230 15" stroke="currentColor" strokeOpacity=".15" strokeWidth="7" />
        <path d="M15 75C50 70 50 25 91 42S140 74 160 40 190 25 205 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 5" />
        <circle cx="15" cy="75" r="5" fill="currentColor" />
        <circle cx="205" cy="14" r="5" fill="currentColor" />
      </svg>
    </div>
  );
}

function Dashboard({ setPage, setDestination }) {
  const [origin, setOrigin] = useState("SRM University");
  const [destination, setDestinationLocal] = useState("Chennai Central");

  function planRoute(event) {
    event.preventDefault();
    setDestination({ origin, destination });
    setPage("planner");
  }

  return (
    <>
      <section className="hero-panel">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-noise" />
        <div className="hero-content">
          <div className="hero-kicker"><span className="live-dot" /> YOUR PERSONAL MOBILITY INTELLIGENCE</div>
          <h1>Every journey.<br /><span>Reimagined.</span></h1>
          <p>Smarter routes. Clearer decisions. A better way to move through your world.</p>
          <div className="hero-actions">
            <button className="button-primary" onClick={() => setPage("planner")}>Explore routes <span>↗</span></button>
            <button className="button-ghost" onClick={() => setPage("copilot")}><span className="sparkle">✳</span> Meet your AI copilot</button>
          </div>
          <div className="hero-proof"><span className="proof-avatars"><i>D</i><i>S</i><i>R</i></span><span>Built for the way <strong>you move</strong></span><span className="proof-divider" /> <span className="proof-live"><span /> Systems operational</span></div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="hero-planet"><div className="planet-grid" /><div className="planet-core">SR</div></div>
          <div className="floating-chip chip-route"><span className="chip-symbol">↗</span><span><strong>Optimal route</strong><small>AI selected</small></span><span className="chip-check">✓</span></div>
          <div className="floating-chip chip-time"><span className="chip-symbol purple-symbol">◷</span><span><strong>−18 min</strong><small>Time saved</small></span></div>
          <div className="floating-chip chip-ai"><span className="ai-pulse">✳</span><span><strong>AI engine</strong><small>Learning live</small></span></div>
          <div className="hero-coordinates">13°04' N<br />80°12' E</div>
        </div>
        <div className="hero-bottom-line"><span>INTELLIGENT MOBILITY PLATFORM</span><span>DESIGNED FOR WHAT'S NEXT <b>↗</b></span></div>
      </section>

      <div className="welcome-row">
        <div><div className="eyebrow">YOUR MOBILITY AT A GLANCE</div><h2>Your world, in motion<span className="heading-period">.</span></h2></div>
        <div className="date-pill"><span>◷</span> Live overview <i /></div>
      </div>

      <div className="stats-grid">
        <StatCard icon="↗" label="ROUTES ANALYZED" value="1,284" detail="Across your recent journeys" trend="+12.8%" tone="cyan" />
        <StatCard icon="◷" label="TIME RECLAIMED" value="18.6 hrs" detail="Estimated time saved" trend="+8.4%" tone="purple" />
        <StatCard icon="◇" label="SAFER JOURNEYS" value="96.8%" detail="Safety score across routes" trend="+2.1%" tone="green" />
        <StatCard icon="✳" label="AI CONFIDENCE" value="98.2%" detail="Route recommendation score" trend="Optimal" tone="orange" />
      </div>

      <div className="dashboard-grid">
        <section className="surface route-search-card">
          <div className="card-heading">
            <div><div className="eyebrow">LET'S GET YOU THERE</div><h3>Plan your next move</h3><p>Where will the road take you?</p></div>
            <div className="heading-icon">⌁</div>
          </div>
          <form className="route-form" onSubmit={planRoute}>
            <label className="location-field">
              <span className="location-marker origin-marker" />
              <span className="field-content"><span>FROM</span><input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Choose starting point" required /></span>
              <span className="field-gps">◎</span>
            </label>
            <div className="route-connector"><span /></div>
            <label className="location-field">
              <span className="location-marker destination-marker" />
              <span className="field-content"><span>TO</span><input value={destination} onChange={(e) => setDestinationLocal(e.target.value)} placeholder="Where to?" required /></span>
              <span className="field-gps">↗</span>
            </label>
            <div className="quick-destinations"><span>QUICK DESTINATIONS</span><button type="button" onClick={() => setDestinationLocal("Chennai Airport")}>✈ Airport</button><button type="button" onClick={() => setDestinationLocal("Chennai Central")}>▦ Central</button></div>
            <button className="button-primary plan-submit" type="submit">Find the best route <span>↗</span></button>
          </form>
          <div className="card-footnote"><span className="tiny-shield">◇</span> Every route, considered for you.</div>
        </section>

        <section className="surface map-preview-card">
          <div className="map-preview-heading"><div><div className="eyebrow">SPATIAL INTELLIGENCE</div><h3>Your city, connected</h3></div><span className="map-status"><i /> MAP ENGINE</span></div>
          <MapIllustration />
          <div className="map-preview-footer"><div><span className="footer-label">ACTIVE NETWORK</span><strong>Chennai metropolitan area</strong></div><button className="icon-button" onClick={() => setPage("planner")} aria-label="Open route planner">↗</button></div>
        </section>
      </div>

      <div className="section-title-row"><div><div className="eyebrow">MADE FOR YOUR EVERYDAY</div><h2>Intelligence that moves with you</h2></div><button className="text-link" onClick={() => setPage("compare")}>Explore capabilities <span>→</span></button></div>
      <div className="feature-grid">
        <button className="feature-card feature-cyan" onClick={() => setPage("planner")}><div className="feature-top"><span className="feature-icon">⌁</span><span className="feature-arrow">↗</span></div><div className="feature-tag">01 / NAVIGATION</div><h3>Routes, refined.</h3><p>Go beyond the obvious. Find a route that fits your time, priorities and journey.</p><div className="feature-link">Open route planner <span>→</span></div><div className="feature-decoration decoration-route">⌁</div></button>
        <button className="feature-card feature-purple" onClick={() => setPage("copilot")}><div className="feature-top"><span className="feature-icon">✳</span><span className="feature-arrow">↗</span></div><div className="feature-tag">02 / CONVERSATIONAL AI</div><h3>Think with your copilot.</h3><p>Ask questions, explore options and make more informed mobility decisions.</p><div className="feature-link">Talk to AI <span>→</span></div><div className="feature-decoration decoration-ai">✳</div></button>
        <button className="feature-card feature-green" onClick={() => setPage("safety")}><div className="feature-top"><span className="feature-icon">◇</span><span className="feature-arrow">↗</span></div><div className="feature-tag">03 / SAFER MOBILITY</div><h3>Arrive with confidence.</h3><p>Bring road conditions and safety considerations into your route decisions.</p><div className="feature-link">Explore safety <span>→</span></div><div className="feature-decoration decoration-shield">◇</div></button>
      </div>

      <div className="section-title-row recent-heading"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>Recent journeys</h2></div><button className="text-link" onClick={() => setPage("saved")}>View saved places <span>→</span></button></div>
      <div className="recent-list">
        {initialRoutes.slice(0, 2).map((route, index) => (
          <button className="recent-row" key={route.id} onClick={() => { setDestination({ origin: route.from, destination: route.to }); setPage("planner"); }}>
            <RouteMiniMap color={index === 0 ? "cyan" : "purple"} />
            <div className="recent-route-names"><strong>{route.from}</strong><span>↓</span><strong>{route.to}</strong></div>
            <div className="recent-meta"><span>EST. DURATION</span><strong>{route.time}</strong></div>
            <div className="recent-meta"><span>DISTANCE</span><strong>{route.distance}</strong></div>
            <span className={`traffic-tag traffic-${route.traffic.toLowerCase()}`}>{route.traffic} traffic</span>
            <span className="recent-arrow">↗</span>
          </button>
        ))}
      </div>
    </>
  );
}

function PlannerPage({ destination, setDestination }) {
  const [origin, setOrigin] = useState(destination.origin);
  const [to, setTo] = useState(destination.destination);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(1);
  const [mode, setMode] = useState("drive");

  function search(event) {
    event.preventDefault();
    setDestination({ origin, destination: to });
    setSearched(true);
  }

  return (
    <>
      <SectionHeading eyebrow="NAVIGATION / ROUTE LAB" title="Find your way forward." description="Compare possibilities. Choose what matters. Let intelligence guide the journey." action={<span className="live-pill"><i /> ENGINE READY</span>} />
      <section className="surface planner-search">
        <form className="planner-search-form" onSubmit={search}>
          <label className="planner-location"><span className="location-marker origin-marker" /><span><small>STARTING POINT</small><input value={origin} onChange={(e) => setOrigin(e.target.value)} required /></span></label>
          <button type="button" className="swap-button" onClick={() => { setOrigin(to); setTo(origin); }}>⇅</button>
          <label className="planner-location"><span className="location-marker destination-marker" /><span><small>DESTINATION</small><input value={to} onChange={(e) => setTo(e.target.value)} required /></span></label>
          <button type="submit" className="button-primary"><span>⌁</span> Calculate routes</button>
        </form>
        <div className="planner-options"><span>TRAVEL MODE</span>{[["drive", "▰", "Drive"], ["transit", "⇄", "Transit"], ["walk", "↗", "Walk"]].map(([id, icon, label]) => <button key={id} className={mode === id ? "mode-active" : ""} onClick={() => setMode(id)}>{icon} {label}</button>)}</div>
      </section>

      <div className="planner-summary"><div><span className="eyebrow">YOUR ROUTE OVERVIEW</span><h2>{origin || "Starting point"} <span>→</span> {to || "Destination"}</h2><p>Illustrative route estimates for the demo interface.</p></div><span className="results-count">03 OPTIONS FOUND</span></div>
      <div className="planner-layout">
        <section className="surface planner-map-card"><div className="map-card-top"><div><span className="eyebrow">LIVE SPATIAL VIEW</span><h3>Route visualization</h3></div><span className="map-status"><i /> PREVIEW</span></div><MapIllustration large route={selected === 2 ? "purple" : "cyan"} /><div className="map-legend"><span><i className="legend-cyan" /> Recommended</span><span><i className="legend-purple" /> Alternative</span><span><i className="legend-muted" /> Road network</span></div><div className="map-note"><span>✳</span><div><strong>Route intelligence</strong><p>Compare the sample options below. Actual traffic and turn-by-turn directions require a connected routing service.</p></div></div></section>
        <section className="route-results"><div className="results-heading"><div><div className="eyebrow">ROUTE OPTIONS</div><h3>Choose your journey</h3></div><span className="results-count">3 OPTIONS</span></div>
          {initialRoutes.map((route, index) => <button key={route.id} className={`route-option ${selected === route.id ? "route-option-selected" : ""}`} onClick={() => setSelected(route.id)}><div className="route-option-top"><span className={`route-number route-number-${route.color}`}>0{index + 1}</span><span className={`traffic-tag traffic-${route.traffic.toLowerCase()}`}>{route.traffic}</span>{index === 0 && <span className="recommended-tag">✳ RECOMMENDED</span>}</div><div className="route-option-time">{mode === "walk" ? `${Math.round(parseInt(route.time) * 12 / 5)} min` : mode === "transit" ? `${Math.round(parseInt(route.time) * 1.25)} min` : route.time}<span>estimated</span></div><div className="route-option-stats"><span>↗ {route.distance}</span><span>◷ {route.note}</span></div><RouteMiniMap color={route.color === "orange" ? "purple" : route.color} /><div className="route-option-bottom"><span>{selected === route.id ? "Selected route" : "Select this route"}</span><span>{selected === route.id ? "✓" : "→"}</span></div></button>)}
          <button className="button-primary full-button" onClick={() => setDestination({ origin, destination: to })}>Use selected route <span>↗</span></button>
        </section>
      </div>
    </>
  );
}

function ComparisonPage() {
  const [metric, setMetric] = useState("balanced");
  const metrics = [{ id: "balanced", label: "Balanced", description: "Best overall experience" }, { id: "fast", label: "Fastest", description: "Prioritize travel time" }, { id: "safe", label: "Safety first", description: "Prioritize safer choices" }];
  return (
    <>
      <SectionHeading eyebrow="DECISION INTELLIGENCE" title="See every possibility." description="Good navigation gives you a route. Great navigation gives you a reason to choose it." />
      <div className="metric-selector">{metrics.map((item) => <button key={item.id} onClick={() => setMetric(item.id)} className={metric === item.id ? "metric-active" : ""}><span>{metric === item.id ? "◉" : "○"}</span><div><strong>{item.label}</strong><small>{item.description}</small></div></button>)}</div>
      <div className="comparison-hero surface"><div><div className="eyebrow">YOUR DECISION, VISUALIZED</div><h2>{metric === "fast" ? "Time is your priority." : metric === "safe" ? "Confidence comes first." : "The smartest path is a balance."}</h2><p>{metric === "fast" ? "Explore the shortest estimated travel time from the sample options." : metric === "safe" ? "Safety considerations can help you compare routes beyond distance alone." : "Compare time, distance and traffic together before deciding."}</p><div className="comparison-tags"><span>↗ Route efficiency</span><span>◷ Travel time</span><span>◇ Safety context</span></div></div><div className="comparison-orb"><span>✳</span><small>DECISION<br />ENGINE</small></div></div>
      <div className="section-title-row"><div><div className="eyebrow">SIDE-BY-SIDE ANALYSIS</div><h2>Three routes. One clear decision.</h2></div><span className="demo-badge">DEMO DATA</span></div>
      <div className="comparison-table surface"><div className="comparison-table-head"><span>ROUTE</span><span>EST. TIME</span><span>DISTANCE</span><span>TRAFFIC</span><span>PROFILE</span></div>{initialRoutes.map((route, i) => <div className="comparison-table-row" key={route.id}><div className="table-route"><span className={`route-number route-number-${route.color}`}>0{i + 1}</span><span><strong>{i === 0 ? "Balanced route" : i === 1 ? "Local streets" : "Outer corridor"}</strong><small>{route.note}</small></span></div><strong>{route.time}</strong><strong>{route.distance}</strong><span className={`traffic-tag traffic-${route.traffic.toLowerCase()}`}>{route.traffic}</span><div className="profile-bars"><i style={{ width: `${[85, 65, 40][i]}%` }} /><i style={{ width: `${[70, 90, 45][i]}%` }} /><i style={{ width: `${[90, 78, 50][i]}%` }} /></div></div>)}</div>
      <p className="disclaimer-note">These are illustrative interface values, not live routing results. Connect a routing and traffic data provider for real-world comparisons.</p>
    </>
  );
}

function CopilotPage() {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hey there! I'm your SmartRoute copilot. I can help you think through route options, travel preferences and mobility questions. Where are we headed?" }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const suggestions = ["Find a faster route", "How do I compare routes?", "What affects road safety?", "Help me plan a commute"];

  function sendMessage(text = input) {
    const question = text.trim();
    if (!question || thinking) return;
    setMessages((previous) => [...previous, { role: "user", text: question }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      let reply = "I'd start by comparing your options across estimated travel time, distance and traffic. SmartRoute's demo currently uses illustrative data, so connect a live routing service before relying on real-world journey estimates.";
      if (/fast|quick|time|faster/i.test(question)) reply = "For a faster journey, compare the estimated duration of each route first. Then check traffic conditions and distance. In the Route Planner, you can select a route to see its sample details.";
      else if (/safe|safety/i.test(question)) reply = "A thoughtful route decision considers more than speed. Look at road type, junction complexity, visibility and current conditions when that data is available. The Road Safety section is a demo interface for exploring these ideas.";
      else if (/traffic/i.test(question)) reply = "Traffic can change a route's travel time considerably. The Traffic Monitor page currently shows demo indicators; live congestion requires a traffic data provider.";
      else if (/hello|hi|hey/i.test(question)) reply = "Hey! 👋 Ready when you are. Tell me where you're going or what you'd like to understand about your journey.";
      setMessages((previous) => [...previous, { role: "assistant", text: reply }]);
      setThinking(false);
    }, 700);
  }

  return (
    <>
      <SectionHeading eyebrow="YOUR INTELLIGENT TRAVEL COMPANION" title="Think beyond the route." description="A little conversation can make your next journey a whole lot clearer." action={<span className="live-pill"><i /> COPILOT ONLINE</span>} />
      <div className="copilot-layout">
        <section className="copilot-main surface">
          <div className="copilot-header"><div className="copilot-avatar"><span>✳</span><i /></div><div><strong>SmartRoute Copilot</strong><small><span /> Your mobility companion</small></div><span className="copilot-model">SR / ASSISTANT</span></div>
          <div className="chat-messages">{messages.map((message, index) => <div key={index} className={`chat-message ${message.role === "user" ? "message-user" : "message-assistant"}`}><div className="message-avatar">{message.role === "user" ? "Y" : "✳"}</div><div className="message-body"><span className="message-sender">{message.role === "user" ? "YOU" : "SMARTROUTE AI"}</span><p>{message.text}</p></div></div>)}{thinking && <div className="chat-message message-assistant"><div className="message-avatar">✳</div><div className="thinking-dots"><i /><i /><i /></div></div>}</div>
          {messages.length < 3 && <div className="suggested-prompts"><span>TRY ASKING</span>{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion} <span>↗</span></button>)}</div>}
          <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your next journey..." aria-label="Message SmartRoute Copilot" /><button type="submit" disabled={!input.trim() || thinking} aria-label="Send message">{thinking ? <span className="button-spinner" /> : "↗"}</button></form>
          <div className="chat-disclaimer">DEMO MODE · Responses are illustrative and not connected to a live AI service.</div>
        </section>
        <aside className="copilot-sidebar">
          <section className="surface copilot-side-card"><div className="eyebrow">COPILOT CAPABILITIES</div><h3>One place to think it through.</h3>{[["⌁", "Route discovery", "Explore travel alternatives"], ["⇄", "Decision support", "Compare route trade-offs"], ["◇", "Safety context", "Consider safer choices"], ["◷", "Commute planning", "Think through your routine"]].map(([icon, title, detail]) => <div className="capability-row" key={title}><span>{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><i>↗</i></div>)}</section>
          <section className="copilot-tip-card"><span className="tip-sparkle">✳</span><div className="eyebrow">A BETTER QUESTION</div><h3>Start with what matters to you.</h3><p>Try “I want a calmer commute” or “Help me compare my options.”</p></section>
        </aside>
      </div>
    </>
  );
}

function TrafficPage() {
  const [filter, setFilter] = useState("All zones");
  const zones = [{ name: "OMR corridor", status: "Moderate", level: 62, color: "orange", delay: "+8 min", area: "South Chennai" }, { name: "GST Road", status: "Light", level: 28, color: "green", delay: "+2 min", area: "Airport corridor" }, { name: "Central junctions", status: "Heavy", level: 86, color: "red", delay: "+16 min", area: "Central Chennai" }, { name: "University access", status: "Light", level: 32, color: "green", delay: "+3 min", area: "Kattankulathur" }];
  const filtered = filter === "All zones" ? zones : zones.filter((zone) => zone.status === filter);
  return (
    <>
      <SectionHeading eyebrow="NETWORK AWARENESS" title="Read the rhythm of the road." description="A clearer view of the movement around you, all in one place." action={<span className="demo-badge">SAMPLE CONDITIONS</span>} />
      <div className="traffic-hero-grid"><section className="traffic-map-panel surface"><div className="map-preview-heading"><div><div className="eyebrow">NETWORK OVERVIEW</div><h3>Chennai mobility network</h3></div><span className="map-status"><i /> PREVIEW</span></div><MapIllustration large /><div className="traffic-legend"><span><i className="legend-green" /> Light</span><span><i className="legend-orange" /> Moderate</span><span><i className="legend-red" /> Heavy</span></div></section><section className="traffic-score-panel surface"><div className="eyebrow">NETWORK FLOW INDEX</div><div className="traffic-score">72<span>/100</span></div><div className="score-meter"><i /></div><span className="traffic-tag traffic-moderate">Moderate flow</span><p>An illustrative network score for the interface preview.</p><div className="score-divider" /><div className="score-row"><span>Zones monitored</span><strong>04</strong></div><div className="score-row"><span>Sample congestion</span><strong>52%</strong></div><div className="score-row"><span>Data mode</span><strong>Demo</strong></div></section></div>
      <div className="section-title-row"><div><div className="eyebrow">ZONE-BY-ZONE</div><h2>Traffic at a glance</h2></div><select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option>All zones</option><option>Light</option><option>Moderate</option><option>Heavy</option></select></div>
      <div className="traffic-zone-grid">{filtered.map((zone) => <article className="surface traffic-zone-card" key={zone.name}><div className="zone-top"><span className={`zone-dot zone-${zone.color}`} /><span className={`traffic-tag traffic-${zone.status.toLowerCase()}`}>{zone.status}</span><button className="subtle-icon">↗</button></div><h3>{zone.name}</h3><p>{zone.area}</p><div className="zone-meter"><i className={`meter-${zone.color}`} style={{ width: `${zone.level}%` }} /></div><div className="zone-bottom"><span>Flow indicator</span><strong>{zone.level}%</strong></div><div className="zone-delay"><span>Illustrative delay</span><strong>{zone.delay}</strong></div></article>)}</div>
      <p className="disclaimer-note">Traffic levels, delays and network scores on this page are sample UI data. They do not represent current road conditions.</p>
    </>
  );
}

function SafetyPage() {
  const [active, setActive] = useState("overview");
  const checks = [{ icon: "◇", title: "Road environment", detail: "Consider road type, junctions and visibility.", status: "CONTEXT" }, { icon: "◷", title: "Time of travel", detail: "Conditions may differ between day and night.", status: "CONTEXT" }, { icon: "⌁", title: "Route complexity", detail: "Compare turns, access roads and unfamiliar areas.", status: "CONTEXT" }, { icon: "◎", title: "Live conditions", detail: "Check official local alerts before travelling.", status: "VERIFY" }];
  return (
    <>
      <SectionHeading eyebrow="SAFER MOBILITY" title="Confidence is part of the journey." description="Look beyond the fastest route. Make room for context, awareness and informed choices." action={<span className="demo-badge">GUIDANCE MODE</span>} />
      <div className="safety-hero surface"><div className="safety-hero-content"><span className="safety-emblem">◇</span><div className="eyebrow">YOUR JOURNEY, CONSIDERED</div><h2>Arrive with more<br /><span>peace of mind.</span></h2><p>Use these considerations to think more carefully about your route. This is guidance, not a live safety assessment.</p><button className="button-primary" onClick={() => setActive(active === "overview" ? "checklist" : "overview")}>{active === "overview" ? "View journey checklist" : "Back to overview"} <span>↗</span></button></div><div className="safety-radar"><div className="radar-ring ring-one" /><div className="radar-ring ring-two" /><div className="radar-ring ring-three" /><div className="radar-sweep" /><span>◇</span><i className="radar-point point-one" /><i className="radar-point point-two" /><i className="radar-point point-three" /></div></div>
      <div className="section-title-row"><div><div className="eyebrow">BEFORE YOU SET OFF</div><h2>{active === "checklist" ? "Your journey checklist" : "A more considered route"}</h2></div><span className="live-pill"><i /> PRACTICAL GUIDANCE</span></div>
      <div className="safety-check-grid">{checks.map((check, index) => <article className="surface safety-check-card" key={check.title}><div className="safety-check-top"><span>{check.icon}</span><small>0{index + 1}</small></div><h3>{check.title}</h3><p>{check.detail}</p><span className="safety-status">{check.status}</span></article>)}</div>
      <div className="safety-note"><span>ⓘ</span><p><strong>Keep it grounded.</strong> This page does not receive live incident, crime, weather or road-hazard data. Follow local traffic rules and official alerts, and use your judgement while travelling.</p></div>
    </>
  );
}

function SavedPage({ savedPlaces, setSavedPlaces }) {
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newPlace, setNewPlace] = useState("");
  const visible = savedPlaces.filter((place) => place.name.toLowerCase().includes(query.toLowerCase()));
  function addPlace(event) {
    event.preventDefault();
    if (!newPlace.trim()) return;
    setSavedPlaces((old) => [...old, { id: Date.now(), name: newPlace.trim(), type: "Personal place", address: "Added to your collection", icon: "⌖" }]);
    setNewPlace("");
    setShowAdd(false);
  }
  return (
    <>
      <SectionHeading eyebrow="YOUR PERSONAL COLLECTION" title="Places worth remembering." description="Keep the destinations that matter close at hand." action={<button className="button-primary" onClick={() => setShowAdd(!showAdd)}>＋ Add a place</button>} />
      {showAdd && <form className="surface add-place-form" onSubmit={addPlace}><label><span>PLACE NAME</span><input value={newPlace} onChange={(e) => setNewPlace(e.target.value)} placeholder="Give your place a name..." required autoFocus /></label><button className="button-primary" type="submit">Save place ↗</button></form>}
      <div className="saved-toolbar"><div className="saved-count"><strong>{savedPlaces.length.toString().padStart(2, "0")}</strong><span>PLACES IN YOUR COLLECTION</span></div><label className="saved-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your places..." /></label></div>
      {visible.length ? <div className="saved-grid">{visible.map((place, index) => <article className="surface saved-place-card" key={place.id}><div className={`saved-place-visual saved-visual-${index % 3}`}><span>{place.icon}</span><small>LOCATION / 0{index + 1}</small><div className="saved-map-lines" /></div><div className="saved-place-content"><span className="eyebrow">{place.type}</span><h3>{place.name}</h3><p>{place.address}</p><div className="saved-place-actions"><button onClick={() => { navigator.clipboard?.writeText(place.name).catch(() => {}); }}>Copy name ↗</button><button className="remove-place" onClick={() => setSavedPlaces((old) => old.filter((item) => item.id !== place.id))} aria-label={`Remove ${place.name}`}>×</button></div></div></article>)}</div> : <div className="surface empty-state"><span>⌕</span><h3>No places found</h3><p>Try another search or add a new place to your collection.</p><button className="button-primary" onClick={() => setShowAdd(true)}>＋ Add a place</button></div>}
    </>
  );
}

function SettingsPage({ compactMode, setCompactMode }) {
  const [units, setUnits] = useState("km");
  const [notifications, setNotifications] = useState(true);
  return (
    <>
      <SectionHeading eyebrow="YOUR EXPERIENCE" title="Make it feel like yours." description="A few thoughtful preferences to shape your SmartRoute workspace." />
      <div className="settings-layout"><section className="surface settings-main"><div className="settings-section-title"><span className="settings-icon">◈</span><div><h3>Workspace preferences</h3><p>Shape how your workspace looks and feels.</p></div></div><div className="settings-row"><div><strong>Compact layout</strong><p>Reduce spacing in information-dense areas.</p></div><button className={`toggle ${compactMode ? "toggle-on" : ""}`} onClick={() => setCompactMode(!compactMode)} aria-label="Toggle compact layout"><i /></button></div><div className="settings-row"><div><strong>Journey notifications</strong><p>Show helpful reminders in this demo experience.</p></div><button className={`toggle ${notifications ? "toggle-on" : ""}`} onClick={() => setNotifications(!notifications)} aria-label="Toggle notifications"><i /></button></div><div className="settings-row"><div><strong>Distance units</strong><p>Choose the units used in journey summaries.</p></div><div className="unit-selector"><button className={units === "km" ? "unit-active" : ""} onClick={() => setUnits("km")}>Kilometres</button><button className={units === "mi" ? "unit-active" : ""} onClick={() => setUnits("mi")}>Miles</button></div></div><div className="settings-section-title settings-section-second"><span className="settings-icon">✳</span><div><h3>About SmartRoute AI</h3><p>Intelligent mobility, designed around you.</p></div></div><div className="about-version"><span className="about-brand">SR<span>✳</span></span><div><strong>SmartRoute AI</strong><small>Futuristic mobility workspace</small></div><span className="version-tag">UI DEMO · v1.0</span></div></section><aside className="settings-side"><div className="settings-gradient-card"><span>✳</span><div className="eyebrow">BUILT FOR WHAT'S NEXT</div><h3>Your journey is just the beginning.</h3><p>Smarter decisions start with a better view of the road ahead.</p><div className="settings-gradient-art">SR<span>AI</span></div></div><div className="surface settings-help"><span>ⓘ</span><div><strong>Demo experience</strong><p>Settings are stored for this session only. Account sync and cloud preferences are not connected.</p></div></div></aside></div>
    </>
  );
}


export default function App() {
  const [page, setPage] = useState("overview");
  const [destination, setDestination] = useState({
    origin: "SRM University",
    destination: "Chennai Central",
  });
  const [savedPlaces, setSavedPlaces] = useState(initialPlaces);
  const [compactMode, setCompactMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("smartroute-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("smartroute-theme", theme);
    } catch {}
  }, [theme]);

  const current = navigation.find((item) => item.id === page) || navigation[0];

  const titles = {
    overview: ["Good to see you.", "Your command center"],
    planner: ["Plan with purpose.", "Route intelligence"],
    compare: ["Clarity changes everything.", "Decision intelligence"],
    copilot: ["Think out loud.", "AI copilot"],
    traffic: ["Stay ahead of the flow.", "Traffic monitor"],
    safety: ["Every detail matters.", "Road safety"],
    saved: ["Your places, your world.", "Saved places"],
    settings: ["A workspace of your own.", "Settings"],
  };

  function navigate(id) {
    setPage(id);
    setMobileMenu(false);
    setGlobalSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitGlobalSearch(event) {
    event.preventDefault();
    const query = globalSearch.toLowerCase();

    if (!query.trim()) return;

    if (/route|destination|direction|plan|map/.test(query)) {
      navigate("planner");
    } else if (/traffic|congestion/.test(query)) {
      navigate("traffic");
    } else if (/safe|safety/.test(query)) {
      navigate("safety");
    } else if (/save|place|favourite|favorite/.test(query)) {
      navigate("saved");
    } else {
      navigate("copilot");
    }
  }

  return (
    <div className={`app-shell theme-${theme} ${compactMode ? "compact-mode" : ""}`}>
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">S</div>
          <div className="workspace-copy">
            <strong>SmartRoute workspace</strong>
            <small>Personal edition</small>
          </div>
          <span className="switcher-chevron">⌄</span>
        </div>

        <div className="nav-scroll">
          {["WORKSPACE", "INTELLIGENCE"].map((group) => (
            <div className="nav-group" key={group}>
              <div className="nav-group-label">{group}</div>

              {navigation
                .filter((item) => item.group === group)
                .map((item) => (
                  <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? "nav-item-active" : ""}`}
                    onClick={() => navigate(item.id)}
                  >
                    <span className="nav-icon">
                      <Icon>{item.icon}</Icon>
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-ai-badge">{item.badge}</span>
                    )}
                    {page === item.id && <span className="nav-active-line" />}
                  </button>
                ))}
            </div>
          ))}

          <div className="nav-group nav-group-extras">
            <div className="nav-group-label">PREFERENCES</div>
            <button
              className={`nav-item ${page === "settings" ? "nav-item-active" : ""}`}
              onClick={() => navigate("settings")}
            >
              <span className="nav-icon">
                <Icon>⚙</Icon>
              </span>
              <span>Settings</span>
              {page === "settings" && <span className="nav-active-line" />}
            </button>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✳</div>
            <strong>Move smarter.</strong>
            <p>Your next great journey starts with a better question.</p>
            <button onClick={() => navigate("copilot")}>
              Explore AI copilot <span>↗</span>
            </button>
            <div className="upgrade-glow" />
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">D</div>
            <div className="profile-info">
              <strong>Explorer</strong>
              <small>Personal workspace</small>
            </div>
            <button
              className="profile-menu"
              onClick={() => navigate("settings")}
              aria-label="Profile settings"
            >
              ···
            </button>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{current.label}</strong>
            </div>
          </div>

          <form className="global-search" onSubmit={submitGlobalSearch}>
            <span>⌕</span>
            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search anything..."
              aria-label="Search workspace"
            />
            <kbd>↵</kbd>
          </form>

          <div className="topbar-actions">
            <span className="topbar-status">
              <i /> All systems normal
            </span>

            <button
              className="theme-toggle"
              onClick={() =>
                setTheme((old) => (old === "dark" ? "light" : "dark"))
              }
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <span>{theme === "dark" ? "☀" : "☾"}</span>
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            <div className="topbar-divider" />

            <button
              className={`topbar-icon ${notificationsOpen ? "topbar-icon-active" : ""}`}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <span>♧</span>
              <i />
            </button>

            <button
              className="topbar-user"
              onClick={() => navigate("settings")}
              aria-label="Open settings"
            >
              D
            </button>

            {notificationsOpen && (
              <div className="notification-popover">
                <strong>Notifications</strong>
                <p>You're all caught up!</p>
                <small>No new notifications in this demo.</small>
              </div>
            )}
          </div>
        </header>

        <div className="page-content">
          <div className="page-welcome">
            <div>
              <span className="welcome-date">
                SMARTROUTE AI <span>•</span>{" "}
                {titles[page]?.[1]?.toUpperCase() || "WORKSPACE"}
              </span>
              <div className="page-greeting">{titles[page]?.[0]}</div>
            </div>

            <div className="welcome-date-right">
              <span className="greeting-status">
                <i /> READY TO EXPLORE
              </span>
            </div>
          </div>

          {page === "overview" && (
            <Dashboard setPage={navigate} setDestination={setDestination} />
          )}

          {page === "planner" && <MapView />}

          {page === "compare" && <ComparisonPage />}

          {page === "copilot" && <CopilotPage />}

          {page === "traffic" && <TrafficPage />}

          {page === "safety" && <SafetyPage />}

          {page === "saved" && (
            <SavedPage
              savedPlaces={savedPlaces}
              setSavedPlaces={setSavedPlaces}
            />
          )}

          {page === "settings" && (
            <SettingsPage
              compactMode={compactMode}
              setCompactMode={setCompactMode}
            />
          )}

          <footer className="app-footer">
            <div className="footer-brand">
              <span>SR</span> SMARTROUTE AI
            </div>
            <span>
              DESIGNED FOR THE WAY FORWARD <b>✳</b>
            </span>
            <span>DEMO INTERFACE · NOT LIVE NAVIGATION</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
