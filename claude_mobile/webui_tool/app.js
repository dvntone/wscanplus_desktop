const { useState, useEffect, useRef } = React;

// ─── OUI Threat Database (embedded — no network needed) ────────────────────
const OUI_DB = {
  "600194": { vendor: "Espressif Deauther", type: "Attack Tool",    threat: "HIGH" },
  "2462AB": { vendor: "Espressif Deauther", type: "Attack Tool",    threat: "HIGH" },
  "240AC4": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "30AEA4": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "A4CF12": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "84F3EB": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "8CAAB5": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "ECFABC": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "E8DB84": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "CC50E3": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "B4E62D": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "DC4F22": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "A8032A": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "BCDDC2": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "2C3AE8": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "943CC6": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "AC67B2": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "4C11AE": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "083AF2": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "FCF5C4": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "1866DA": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "70039F": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "485519": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "6C3B6B": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "D8F15B": { vendor: "Espressif Systems",  type: "Spy Cam Chip",   threat: "HIGH" },
  "001AEF": { vendor: "Hisilicon",          type: "Surveillance SoC", threat: "HIGH" },
  "0080AC": { vendor: "Ingenic Semi",       type: "Camera SoC",    threat: "HIGH" },
  "001C7B": { vendor: "Ambarella",          type: "IP Camera SoC", threat: "HIGH" },
  "3CEF8C": { vendor: "Dahua Technology",   type: "CCTV Brand",    threat: "HIGH" },
  "A41437": { vendor: "Dahua Technology",   type: "CCTV Brand",    threat: "HIGH" },
  "704880": { vendor: "Dahua Technology",   type: "CCTV Brand",    threat: "HIGH" },
  "C056E3": { vendor: "Hikvision",          type: "CCTV Brand",    threat: "HIGH" },
  "BCAD28": { vendor: "Hikvision",          type: "CCTV Brand",    threat: "HIGH" },
  "4419B6": { vendor: "Hikvision",          type: "CCTV Brand",    threat: "HIGH" },
  "306266": { vendor: "Hikvision",          type: "CCTV Brand",    threat: "HIGH" },
  "54C43A": { vendor: "Hikvision",          type: "CCTV Brand",    threat: "HIGH" },
  "EC5064": { vendor: "Hikvision",          type: "CCTV Brand",    threat: "HIGH" },
  "807D3A": { vendor: "Shenzhen Reecam",    type: "Camera",        threat: "HIGH" },
  "702E22": { vendor: "Shenzhen Apexis",    type: "Camera",        threat: "HIGH" },
  "40CBC0": { vendor: "Apple AirTag",       type: "BLE Tracker",   threat: "HIGH" },
  "3CCD57": { vendor: "Apple AirTag",       type: "BLE Tracker",   threat: "HIGH" },
  "7CF05F": { vendor: "Apple AirTag",       type: "BLE Tracker",   threat: "HIGH" },
  "DCE011": { vendor: "Apple FindMy",       type: "BLE Tracker",   threat: "HIGH" },
  "087CBE": { vendor: "Tile Inc",           type: "BLE Tracker",   threat: "HIGH" },
  "AC3743": { vendor: "Tile Inc",           type: "BLE Tracker",   threat: "HIGH" },
  "94A3DA": { vendor: "Samsung SmartTag",   type: "BLE Tracker",   threat: "HIGH" },
  "40D3AE": { vendor: "Samsung SmartTag",   type: "BLE Tracker",   threat: "HIGH" },
  "7C7A91": { vendor: "Samsung SmartTag",   type: "BLE Tracker",   threat: "HIGH" },
  "645AED": { vendor: "Chipolo",            type: "BLE Tracker",   threat: "HIGH" },
  "F0CB8B": { vendor: "Pebblebee",          type: "BLE Tracker",   threat: "HIGH" },
  "EC71DB": { vendor: "Reolink",            type: "IP Camera",     threat: "MED"  },
  "8CF6B1": { vendor: "Reolink",            type: "IP Camera",     threat: "MED"  },
  "001DB5": { vendor: "Axis Comm",          type: "IP Camera",     threat: "MED"  },
  "ACCC8E": { vendor: "Axis Comm",          type: "IP Camera",     threat: "MED"  },
  "000CE7": { vendor: "MediaTek",           type: "IoT Camera",    threat: "MED"  },
  "0090CC": { vendor: "Ralink/MediaTek",    type: "WiFi Camera",   threat: "MED"  },
  "00E04C": { vendor: "Realtek",            type: "WiFi Chip",     threat: "MED"  },
  "1802F3": { vendor: "Tuya Smart",         type: "IoT Device",    threat: "MED"  },
  "A4C138": { vendor: "Tuya Smart",         type: "IoT Device",    threat: "MED"  },
  "CCA304": { vendor: "Tuya Smart",         type: "IoT Device",    threat: "MED"  },
  "680571": { vendor: "Tuya Smart",         type: "IoT Device",    threat: "MED"  },
  "2CF0A2": { vendor: "Shenzhen Bilian",    type: "Generic IoT",   threat: "MED"  },
  "DCA632": { vendor: "Raspberry Pi",       type: "Dev Board",     threat: "LOW"  },
  "B827EB": { vendor: "Raspberry Pi",       type: "Dev Board",     threat: "LOW"  },
  "E45F01": { vendor: "Raspberry Pi",       type: "Dev Board",     threat: "LOW"  },
  "50C7BF": { vendor: "TP-Link",            type: "Router",        threat: "LOW"  },
  "A42BB0": { vendor: "TP-Link",            type: "Router",        threat: "LOW"  },
  "18D6C7": { vendor: "Apple",              type: "Router/AP",     threat: "LOW"  },
  "40B4CD": { vendor: "Google Pixel",       type: "Mobile",        threat: "LOW"  },
  "54EE75": { vendor: "Google Pixel",       type: "Mobile",        threat: "LOW"  },
  "F8A9D0": { vendor: "Samsung",            type: "Mobile",        threat: "LOW"  },
};

function lookupOui(mac) {
  const clean = mac.replace(/[:\-\.]/g, "").toUpperCase().slice(0, 6);
  if (clean.length < 6) return null;
  return OUI_DB[clean] || null;
}

// ─── Phases ────────────────────────────────────────────────────────────────
const PHASES = [
  { id: "VISUAL",      label: "Visual",      num: "01" },
  { id: "IR",          label: "IR Scan",     num: "02" },
  { id: "WIFI",        label: "WiFi / RF",   num: "03" },
  { id: "BLE",         label: "Bluetooth",   num: "04" },
  { id: "TRIANGULATE", label: "Locate",      num: "05" },
  { id: "REPORT",      label: "Report",      num: "06" },
];

// ─── Visual checks (expanded) ───────────────────────────────────────────────
const VISUAL_CHECKS = [
  { id: "smoke",    label: "Smoke detectors",         detail: "Look for a tiny hole or glass lens facing outward. Real smoke detectors have vents, not holes." },
  { id: "clock",    label: "Alarm clocks / radios",   detail: "Pinhole on the face or sides. Body unusually thick for its size." },
  { id: "usb",      label: "USB wall chargers",       detail: "Tiny hole on the face — most common covert cam vector. Heavier than a normal charger." },
  { id: "bulb",     label: "Smart / LED bulbs",       detail: "Bulb cameras look identical to smart bulbs. Check for a dark spot at the base of the glass." },
  { id: "strip",    label: "Power strips",             detail: "Camera hidden in the end cap or along the body. Pinhole on one of the outlet faces." },
  { id: "outlet",   label: "Outlet adapters",         detail: "Plug-in adapters with a tiny hole — very common. Check all adapters that weren't yours." },
  { id: "vent",     label: "Air vents",               detail: "Camera pointed through slats. Shine a light in — look for lens glint." },
  { id: "decor",    label: "Books / shelf items",     detail: "Anything facing the bed, couch, or bathroom with a small gap or hole in the spine/cover." },
  { id: "mirror",   label: "Mirrors",                 detail: "Touch your finger to the glass. If there's a gap between finger and reflection, it's safe. No gap = possibly two-way mirror." },
  { id: "tv",       label: "TV / cable boxes",        detail: "Some TVs have cameras built into the bezel. Cable boxes can be modified. Check for small circles facing the room." },
  { id: "frame",    label: "Picture frames",          detail: "Small hole in the frame material or in the printed image. Check the back too — wires or circuit boards." },
  { id: "stuffed",  label: "Stuffed animals / plants",detail: "Left by a previous tenant or placed as a 'gift.' Check any soft item you didn't bring yourself." },
  { id: "detector", label: "Motion / CO sensors",     detail: "Combination sensor-camera devices are sold openly. Feels heavier than a normal sensor." },
];

// ─── RSSI bands ─────────────────────────────────────────────────────────────
const RSSI_BANDS = [
  { min: -50, label: "VERY CLOSE", color: "#ff3b3b", desc: "Same room, within ~3ft" },
  { min: -65, label: "CLOSE",      color: "#ff8c00", desc: "Same room, ~10ft" },
  { min: -75, label: "MODERATE",   color: "#ffd700", desc: "Same floor" },
  { min: -90, label: "DISTANT",    color: "#4fc3f7", desc: "Far or through walls" },
  { min: -200,label: "EDGE",       color: "#546e7a", desc: "Barely detectable" },
];
function getRssiBand(val) {
  return RSSI_BANDS.find(b => val >= b.min) || RSSI_BANDS[RSSI_BANDS.length - 1];
}
function rssiPercent(val) {
  // -30 = 100%, -100 = 0%
  return Math.max(0, Math.min(100, ((val + 100) / 70) * 100));
}

// ─── Learn mode explanations ────────────────────────────────────────────────
const LEARN = {
  visual: `A physical inspection means walking the space and looking with your eyes before using any technology. Spy cameras need a line of sight to record — meaning they have to point at something. You're looking for anything that has a small hole, glass lens, or dark circle pointing toward a bed, chair, bathroom, or sitting area. This is the most reliable phase because no hardware can detect a camera that isn't transmitting.`,
  ir: `IR stands for Infrared — a type of light invisible to human eyes but visible through a camera lens. Night-vision cameras emit IR light so they can record in the dark. Your phone's front camera has no IR filter, so it shows IR as a bright white or purple glow. If you see a glow in a dark room that your eyes can't see, it's an IR emitter — possibly a hidden camera. This technique has no false positives from WiFi interference.`,
  rssi: `RSSI stands for Received Signal Strength Indicator. It's measured in negative numbers — the closer to zero, the stronger the signal. -45 is very strong (device nearby). -85 is weak (far away or through walls). When you move around a room with a target device in your scan, watching RSSI change tells you which direction the device is in. The position where RSSI is strongest (closest to zero) is the direction of the device.`,
  mac: `A MAC address is like a device's fingerprint — a unique identifier built into its network hardware at manufacture. The first 6 characters of a MAC address identify the manufacturer. This is called the OUI (Organizationally Unique Identifier). Looking up the OUI tells you what company made the chip inside the device. If that company makes surveillance equipment or cheap IoT cameras, it's a flag worth investigating.`,
  ble: `BLE stands for Bluetooth Low Energy. It's a short-range wireless technology used in trackers (AirTags, Tile), wireless audio bugs, some cameras, and BLE-enabled data-transmitting devices. BLE devices often transmit brief bursts and go quiet — making them harder to catch with a single scan. Multiple passes at different times catches burst-transmit devices that would be missed on a single sweep.`,
  triangulate: `Triangulation means using signal strength from multiple positions to estimate where a device is located. You stand in three different spots in the room, record the RSSI of the suspect device from each position, and the position with the strongest signal (least negative number) points toward the device. It won't give you a precise location but it narrows the search area significantly.`,
};

// ─── Reusable components ───────────────────────────────────────────────────

function ScanOverlay() {
  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,
      background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,70,0.012) 2px,rgba(0,255,70,0.012) 4px)",
      pointerEvents:"none",zIndex:9999
    }}/>
  );
}

function Blink({ children, color }) {
  const [v,setV] = useState(true);
  useEffect(()=>{ const t=setInterval(()=>setV(x=>!x),600); return()=>clearInterval(t); },[]);
  return <span style={{opacity:v?1:0,color:color||"inherit"}}>{children}</span>;
}

function PhaseBar({ current }) {
  return (
    <div style={{display:"flex",gap:3,marginBottom:20}}>
      {PHASES.map((p,i)=>(
        <div key={p.id} style={{
          flex:1,height:3,borderRadius:2,
          background: i<current?"#00ff46":i===current?"#00ff46":"#1a2a1a",
          opacity: i===current?1:i<current?0.4:0.15,
          transition:"all 0.3s"
        }}/>
      ))}
    </div>
  );
}

function LearnBox({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{marginBottom:12}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{
          background:"transparent",border:"1px solid #1a3a1a",
          color:"#2a6a2a",padding:"6px 12px",fontSize:10,letterSpacing:2,
          cursor:"pointer",fontFamily:"'Courier New',monospace",width:"100%",
          textAlign:"left",display:"flex",justifyContent:"space-between"
        }}
      >
        <span>? WHAT DOES THIS MEAN</span>
        <span>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{
          background:"#050e05",border:"1px solid #1a3a1a",borderTop:"none",
          padding:"12px 14px",fontSize:12,color:"#4a9a4a",lineHeight:1.8,
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

function ThreatBadge({ threat, type }) {
  const colors = { HIGH:"#ff3b3b", MED:"#ffd700", LOW:"#4fc3f7" };
  const c = colors[threat] || "#546e7a";
  return (
    <span style={{
      fontSize:9,letterSpacing:1,padding:"2px 6px",
      border:`1px solid ${c}`,color:c,borderRadius:2,
      fontFamily:"'Courier New',monospace",
    }}>
      {threat} — {type}
    </span>
  );
}

function RssiBar({ value }) {
  if (!value || isNaN(parseInt(value))) return null;
  const val = parseInt(value);
  const band = getRssiBand(val);
  const pct = rssiPercent(val);
  return (
    <div style={{marginTop:8}}>
      <div style={{
        height:6,background:"#0a180a",borderRadius:3,overflow:"hidden",marginBottom:6
      }}>
        <div style={{
          height:"100%",width:`${pct}%`,background:band.color,
          borderRadius:3,transition:"width 0.4s ease",
          boxShadow:`0 0 8px ${band.color}66`
        }}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:7,height:7,background:band.color,borderRadius:"50%"}}/>
        <span style={{color:band.color,fontSize:11,letterSpacing:1}}>{band.label}</span>
        <span style={{color:"#2a5a2a",fontSize:10}}>{band.desc}</span>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
function SweepTool() {
  const [phase, setPhase]           = useState(0);
  const [checks, setChecks]         = useState({});
  const [irResult, setIrResult]     = useState(null);
  const [devices, setDevices]       = useState([]);
  const [devInput, setDevInput]     = useState({ name:"", mac:"", rssi:"" });
  const [bleDevices, setBleDevices] = useState([]);
  const [bleInput, setBleInput]     = useState({ name:"", mac:"" });
  const [positions, setPositions]   = useState([
    { label:"POSITION ALPHA",   rssi:"", note:"" },
    { label:"POSITION BRAVO",   rssi:"", note:"" },
    { label:"POSITION CHARLIE", rssi:"", note:"" },
  ]);
  const [findings, setFindings]     = useState([]);
  const [findingInput, setFindingInput] = useState("");
  const [copied, setCopied]         = useState(false);
  const [sweepTime] = useState(new Date().toISOString().slice(0,19).replace("T"," "));

  const toggleCheck = id => setChecks(c=>({...c,[id]:!c[id]}));
  const allVisual   = VISUAL_CHECKS.every(c=>checks[c.id]);

  const validPositions  = positions.filter(p=>p.rssi!==""&&!isNaN(parseInt(p.rssi)));
  const strongestPos    = validPositions.length>0
    ? validPositions.reduce((a,b)=>parseInt(a.rssi)>parseInt(b.rssi)?a:b) : null;

  // Device add/flag
  const addDevice = () => {
    if (!devInput.name.trim()) return;
    const oui = lookupOui(devInput.mac);
    setDevices(d=>[...d,{...devInput,id:Date.now(),flagged:!!oui&&oui.threat==="HIGH",oui}]);
    setDevInput({name:"",mac:"",rssi:""});
  };
  const toggleFlag = id => setDevices(d=>d.map(x=>x.id===id?{...x,flagged:!x.flagged}:x));

  // BLE device add/flag
  const addBle = () => {
    if (!bleInput.name.trim()) return;
    const oui = lookupOui(bleInput.mac);
    setBleDevices(d=>[...d,{...bleInput,id:Date.now(),flagged:!!oui&&oui.threat==="HIGH",oui}]);
    setBleInput({name:"",mac:""});
  };
  const toggleBleFlag = id => setBleDevices(d=>d.map(x=>x.id===id?{...x,flagged:!x.flagged}:x));

  // Findings
  const addFinding = () => {
    if (!findingInput.trim()) return;
    setFindings(f=>[...f,{text:findingInput,time:new Date().toLocaleTimeString()}]);
    setFindingInput("");
  };

  // Add position
  const addPosition = () => {
    const labels=["DELTA","ECHO","FOXTROT","GOLF","HOTEL","INDIA"];
    const next = labels[positions.length-3] || `POS ${positions.length+1}`;
    setPositions(p=>[...p,{label:`POSITION ${next}`,rssi:"",note:""}]);
  };

  // MAC live lookup while typing
  const macLookup = lookupOui(devInput.mac);
  const bleLookup = lookupOui(bleInput.mac);

  // Stats
  const flaggedDevices   = devices.filter(d=>d.flagged);
  const flaggedBle       = bleDevices.filter(d=>d.flagged);
  const suspectPositions = validPositions.filter(p=>parseInt(p.rssi)>-65);
  const totalFlagged     = flaggedDevices.length + flaggedBle.length;

  // Overall verdict
  const isAlert       = totalFlagged>0 || irResult==="positive";
  const isInconclusive= !isAlert && (irResult==="suspect" || suspectPositions.length>0);
  const verdictColor  = isAlert?"#ff3b3b":isInconclusive?"#ffd700":"#00ff46";
  const verdictLabel  = isAlert?"⚠ SUSPECT":isInconclusive?"INCONCLUSIVE":"CLEAR";

  // Export report
  const buildReport = () => {
    const lines = [
      "════════════════════════════════════",
      " RF / CAM FIELD SWEEP REPORT",
      "════════════════════════════════════",
      `INITIATED : ${sweepTime}`,
      `VERDICT   : ${verdictLabel}`,
      "",
      "── VISUAL CHECKS ──────────────────",
      ...VISUAL_CHECKS.map(c=>`[${checks[c.id]?"X":" "}] ${c.label}`),
      "",
      `── IR SCAN ─────────────────────────`,
      `RESULT: ${irResult ? irResult.toUpperCase() : "NOT RUN"}`,
      "",
      "── WiFi DEVICES LOGGED ─────────────",
      ...devices.map(d=>`${d.flagged?"[FLAGGED]":"[      ]"} ${d.name}${d.mac?` [${d.mac}]`:""}${d.oui?` — ${d.oui.vendor} (${d.oui.threat})`:""}${d.rssi?` RSSI:${d.rssi}dBm`:""}`),
      devices.length===0?"  NONE":"",
      "",
      "── BLE DEVICES LOGGED ──────────────",
      ...bleDevices.map(d=>`${d.flagged?"[FLAGGED]":"[      ]"} ${d.name}${d.mac?` [${d.mac}]`:""}${d.oui?` — ${d.oui.vendor} (${d.oui.threat})`:""}`),
      bleDevices.length===0?"  NONE":"",
      "",
      "── TRIANGULATION ───────────────────",
      ...validPositions.map(p=>`${p.label.padEnd(20)} ${p.rssi} dBm${p.label===strongestPos?.label?" ← STRONGEST":""}${p.note?` (${p.note})`:""}`),
      validPositions.length===0?"  NOT RUN":"",
      "",
      "── FIELD NOTES ─────────────────────",
      ...findings.map(f=>`[${f.time}] ${f.text}`),
      findings.length===0?"  NONE":"",
      "",
      "════════════════════════════════════",
      " FOR DEFENSIVE USE ONLY",
      "════════════════════════════════════",
    ];
    return lines.join("\n");
  };

  const copyReport = () => {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      console.error("Clipboard API is not available in this environment.");
      window.alert("Copy failed: your browser does not support automatic copying. Please select and copy the report manually.");
      return;
    }
    navigator.clipboard.writeText(buildReport())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy report to clipboard:", err);
        setCopied(false);
        window.alert("Copy failed. Please select and copy the report text manually.");
      });
  };

  // ── Styles ─────────────────────────────────────────────────────────────
  const S = {
    input: {
      background:"#0a120a",border:"1px solid #1e3a1e",color:"#00ff46",
      padding:"10px 12px",fontFamily:"'Courier New',monospace",fontSize:13,
      outline:"none",borderRadius:2,width:"100%",boxSizing:"border-box",
    },
    btn: {
      background:"transparent",border:"1px solid #00ff46",color:"#00ff46",
      padding:"10px 20px",fontFamily:"'Courier New',monospace",fontSize:11,
      letterSpacing:2,cursor:"pointer",textTransform:"uppercase",borderRadius:2,
    },
    btnDim: {
      background:"transparent",border:"1px solid #1e3a1e",color:"#3a6a3a",
      padding:"10px 20px",fontFamily:"'Courier New',monospace",fontSize:11,
      letterSpacing:2,cursor:"pointer",textTransform:"uppercase",borderRadius:2,
    },
    btnRed: {
      background:"transparent",border:"1px solid #ff3b3b",color:"#ff3b3b",
      padding:"4px 10px",fontFamily:"'Courier New',monospace",fontSize:10,
      cursor:"pointer",textTransform:"uppercase",borderRadius:2,letterSpacing:1,
    },
    card: {
      background:"#070f07",border:"1px solid #1a2e1a",
      borderRadius:4,padding:14,marginBottom:10,
    },
  };

  const nav = (n) => () => setPhase(n);

  return (
    <div style={{
      minHeight:"100vh",background:"#040a04",color:"#00ff46",
      fontFamily:"'Courier New',monospace",padding:"20px 16px",
      maxWidth:500,margin:"0 auto",fontSize:13,
    }}>
      <ScanOverlay/>

      {/* ── Header ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:9,color:"#1e4a1e",letterSpacing:4,marginBottom:4}}>
          FIELD SWEEP PROTOCOL v2.0
        </div>
        <div style={{fontSize:22,fontWeight:"bold",letterSpacing:2,lineHeight:1.1}}>
          RF / CAM<br/>DETECTION
        </div>
        <div style={{fontSize:9,color:"#1e4a1e",marginTop:6,letterSpacing:2}}>
          INITIATED: {sweepTime} <Blink>█</Blink>
        </div>
        <div style={{
          marginTop:10,display:"flex",gap:8,alignItems:"center",
          fontSize:11,color:verdictColor,letterSpacing:2,
        }}>
          <div style={{width:8,height:8,borderRadius:"50%",background:verdictColor,boxShadow:`0 0 6px ${verdictColor}`}}/>
          CURRENT STATUS: {verdictLabel}
        </div>
      </div>

      <PhaseBar current={phase}/>

      {/* ── Nav ── */}
      <div style={{display:"flex",gap:3,marginBottom:20,flexWrap:"wrap"}}>
        {PHASES.map((p,i)=>(
          <button key={p.id} onClick={()=>setPhase(i)} style={{
            ...(i===phase?S.btn:S.btnDim),
            fontSize:9,padding:"6px 8px",letterSpacing:1,
          }}>
            {p.num} {p.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          PHASE 0 — VISUAL
          ══════════════════════════════════════════════════════════ */}
      {phase===0&&(
        <div>
          <div style={{color:"#1e4a1e",fontSize:9,letterSpacing:3,marginBottom:12}}>
            PHASE 01 — PHYSICAL INSPECTION
          </div>
          <LearnBox text={LEARN.visual}/>
          <div style={{...S.card,borderColor:"#1a3a1a",marginBottom:14,fontSize:12,color:"#4a9a4a",lineHeight:1.8}}>
            <strong style={{color:"#7aff7a"}}>Before you start:</strong> darkened room helps. Use flashlight.
            Look for a tiny glass lens or pinhole facing beds, chairs, bathrooms, or couches.
            Cameras need line of sight — they point at what they record.
          </div>
          {VISUAL_CHECKS.map(c=>(
            <div key={c.id} onClick={()=>toggleCheck(c.id)} style={{
              ...S.card,cursor:"pointer",
              borderColor:checks[c.id]?"#00ff46":"#1a2e1a",
              display:"flex",alignItems:"flex-start",gap:12,
              transition:"border-color 0.2s",
            }}>
              <div style={{
                width:18,height:18,border:`1px solid ${checks[c.id]?"#00ff46":"#2a4a2a"}`,
                background:checks[c.id]?"#00ff46":"transparent",
                flexShrink:0,marginTop:2,borderRadius:2,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#040a04",fontSize:11,fontWeight:"bold",
              }}>
                {checks[c.id]?"✓":""}
              </div>
              <div style={{flex:1}}>
                <div style={{color:checks[c.id]?"#00ff46":"#4a7a4a",letterSpacing:1,fontSize:12}}>
                  {c.label}
                </div>
                <div style={{fontSize:11,color:"#2a5a2a",marginTop:3,lineHeight:1.6}}>
                  {c.detail}
                </div>
              </div>
            </div>
          ))}
          <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:allVisual?"#00ff46":"#2a5a2a"}}>
              {Object.values(checks).filter(Boolean).length}/{VISUAL_CHECKS.length} CHECKED
              {allVisual&&<span style={{marginLeft:8,color:"#00ff46"}}>✓ COMPLETE</span>}
            </div>
            <button onClick={nav(1)} style={S.btn}>NEXT →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHASE 1 — IR
          ══════════════════════════════════════════════════════════ */}
      {phase===1&&(
        <div>
          <div style={{color:"#1e4a1e",fontSize:9,letterSpacing:3,marginBottom:12}}>
            PHASE 02 — IR ILLUMINATOR SCAN
          </div>
          <LearnBox text={LEARN.ir}/>
          <div style={S.card}>
            <div style={{marginBottom:10,letterSpacing:1,color:"#7aff7a",fontSize:12}}>PROCEDURE</div>
            <ol style={{margin:0,paddingLeft:18,lineHeight:2.2,color:"#4a7a4a",fontSize:12}}>
              <li>Darken room completely</li>
              <li>Open your phone's <strong style={{color:"#7aff7a"}}>FRONT camera</strong> — it has no IR filter</li>
              <li>Pan slowly — full 360° sweep of room</li>
              <li>Night-vision cams emit IR = <strong style={{color:"#ff3b3b"}}>purple or white glow</strong> on screen</li>
              <li>Check vents, clocks, chargers, picture frames, smoke detectors</li>
              <li>Your TV remote is a quick test — point at front camera, press a button. You'll see a purple flash. That's IR. Camera IR glows constantly.</li>
            </ol>
          </div>
          <div style={{marginBottom:10,color:"#2a5a2a",fontSize:10,letterSpacing:2}}>RECORD YOUR RESULT</div>
          {[
            {val:"clean",    label:"CLEAN — No IR sources detected",         color:"#00ff46"},
            {val:"suspect",  label:"SUSPECT — Possible IR source, unclear",  color:"#ffd700"},
            {val:"positive", label:"POSITIVE — IR glow confirmed on camera", color:"#ff3b3b"},
          ].map(opt=>(
            <div key={opt.val} onClick={()=>setIrResult(opt.val)} style={{
              ...S.card,cursor:"pointer",
              borderColor:irResult===opt.val?opt.color:"#1a2e1a",
              color:irResult===opt.val?opt.color:"#2a5a2a",
              letterSpacing:1,fontSize:12,padding:"14px 16px",
              transition:"border-color 0.15s",
            }}>
              {irResult===opt.val?"► ":"  "}{opt.label}
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
            <button onClick={nav(0)} style={S.btnDim}>← BACK</button>
            <button onClick={nav(2)} style={S.btn}>NEXT →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHASE 2 — WIFI / RF
          ══════════════════════════════════════════════════════════ */}
      {phase===2&&(
        <div>
          <div style={{color:"#1e4a1e",fontSize:9,letterSpacing:3,marginBottom:12}}>
            PHASE 03 — WiFi / RF DEVICE LOG
          </div>
          <LearnBox text={LEARN.mac}/>
          <div style={{...S.card,fontSize:12,color:"#2a5a2a",lineHeight:1.8,marginBottom:14}}>
            Run <strong style={{color:"#7aff7a"}}>Marauder → Scan → ap</strong> or use the Fing app.
            Log every device you see that you <strong style={{color:"#ffd700"}}>cannot identify</strong> as your own.
            Paste the MAC address — vendor is looked up instantly.
          </div>

          <div style={S.card}>
            <div style={{color:"#2a5a2a",fontSize:10,letterSpacing:2,marginBottom:10}}>LOG DEVICE</div>
            <input style={{...S.input,marginBottom:8}} placeholder="Device name or SSID"
              value={devInput.name} onChange={e=>setDevInput(d=>({...d,name:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&addDevice()}/>
            <input style={{...S.input,marginBottom:4}} placeholder="MAC address (e.g. 24:0A:C4:xx:xx:xx)"
              value={devInput.mac} onChange={e=>setDevInput(d=>({...d,mac:e.target.value}))}/>
            {/* Live OUI lookup */}
            {devInput.mac.replace(/[:\-\.]/g,"").length>=6&&(
              <div style={{
                padding:"8px 10px",marginBottom:8,fontSize:11,
                background:macLookup?"#0a0f0a":"#0f0a0a",
                border:`1px solid ${macLookup?(macLookup.threat==="HIGH"?"#ff3b3b44":macLookup.threat==="MED"?"#ffd70044":"#00ff4644"):"#1a1a1a"}`,
                borderRadius:2,
              }}>
                {macLookup?(
                  <div>
                    <span style={{color:"#2a5a2a",marginRight:8}}>VENDOR:</span>
                    <span style={{color:macLookup.threat==="HIGH"?"#ff3b3b":macLookup.threat==="MED"?"#ffd700":"#4fc3f7"}}>
                      {macLookup.vendor}
                    </span>
                    <span style={{color:"#2a5a2a",marginLeft:8}}>—</span>
                    <span style={{marginLeft:8}}><ThreatBadge threat={macLookup.threat} type={macLookup.type}/></span>
                  </div>
                ):<span style={{color:"#1e3a1e",letterSpacing:1}}>OUI NOT IN DB — check maclookup.app</span>}
              </div>
            )}
            <input style={{...S.input,marginBottom:10}} placeholder="RSSI (optional, e.g. -72)"
              value={devInput.rssi} onChange={e=>setDevInput(d=>({...d,rssi:e.target.value}))}
              type="number"/>
            <button onClick={addDevice} style={{...S.btn,width:"100%"}}>+ LOG DEVICE</button>
          </div>

          {devices.map(d=>(
            <div key={d.id} style={{
              ...S.card,
              borderColor:d.flagged?"#ff3b3b44":"#1a2e1a",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{color:d.flagged?"#ff3b3b":"#7aff7a",letterSpacing:1,marginBottom:3}}>
                    {d.name}
                  </div>
                  {d.mac&&<div style={{fontSize:10,color:"#2a5a2a",marginBottom:4}}>{d.mac}</div>}
                  {d.oui&&<ThreatBadge threat={d.oui.threat} type={d.oui.type}/>}
                  {!d.oui&&d.mac&&<span style={{fontSize:10,color:"#1e3a1e",letterSpacing:1}}>OUI unknown</span>}
                  {d.rssi&&<RssiBar value={d.rssi}/>}
                </div>
                <button onClick={()=>toggleFlag(d.id)} style={{
                  ...d.flagged?S.btnRed:S.btnDim,
                  marginLeft:10,flexShrink:0,fontSize:9,padding:"4px 8px",
                }}>
                  {d.flagged?"⚠ FLAGGED":"FLAG"}
                </button>
              </div>
            </div>
          ))}
          {devices.length===0&&(
            <div style={{color:"#1e3a1e",textAlign:"center",padding:20,letterSpacing:2,fontSize:10}}>
              NO DEVICES LOGGED
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
            <button onClick={nav(1)} style={S.btnDim}>← BACK</button>
            <button onClick={nav(3)} style={S.btn}>NEXT →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHASE 3 — BLE (NEW)
          ══════════════════════════════════════════════════════════ */}
      {phase===3&&(
        <div>
          <div style={{color:"#1e4a1e",fontSize:9,letterSpacing:3,marginBottom:12}}>
            PHASE 04 — BLUETOOTH / BLE SCAN
          </div>
          <LearnBox text={LEARN.ble}/>
          <div style={{...S.card,fontSize:12,color:"#2a5a2a",lineHeight:1.8,marginBottom:14}}>
            On your Flipper: <strong style={{color:"#7aff7a"}}>BLE Sniff Full → generic</strong> or use the nRF Connect app on your phone.
            Log any BLE device you don't recognize — especially trackers.
            AirTag MAC addresses rotate but OUI prefix stays constant.
          </div>

          <div style={S.card}>
            <div style={{color:"#2a5a2a",fontSize:10,letterSpacing:2,marginBottom:10}}>LOG BLE DEVICE</div>
            <input style={{...S.input,marginBottom:8}} placeholder="Device name or advertisement type"
              value={bleInput.name} onChange={e=>setBleInput(d=>({...d,name:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&addBle()}/>
            <input style={{...S.input,marginBottom:4}} placeholder="MAC address (optional)"
              value={bleInput.mac} onChange={e=>setBleInput(d=>({...d,mac:e.target.value}))}/>
            {bleInput.mac.replace(/[:\-\.]/g,"").length>=6&&(
              <div style={{
                padding:"8px 10px",marginBottom:8,fontSize:11,
                background:bleLookup?"#0a0f0a":"#0f0a0a",
                border:`1px solid ${bleLookup?(bleLookup.threat==="HIGH"?"#ff3b3b44":"#00ff4644"):"#1a1a1a"}`,
                borderRadius:2,
              }}>
                {bleLookup?(
                  <div>
                    <span style={{color:"#2a5a2a",marginRight:8}}>VENDOR:</span>
                    <span style={{color:bleLookup.threat==="HIGH"?"#ff3b3b":"#4fc3f7"}}>
                      {bleLookup.vendor}
                    </span>
                    <span style={{marginLeft:8}}><ThreatBadge threat={bleLookup.threat} type={bleLookup.type}/></span>
                  </div>
                ):<span style={{color:"#1e3a1e",letterSpacing:1}}>OUI NOT IN DB</span>}
              </div>
            )}
            <button onClick={addBle} style={{...S.btn,width:"100%"}}>+ LOG BLE DEVICE</button>
          </div>

          {bleDevices.map(d=>(
            <div key={d.id} style={{
              ...S.card,borderColor:d.flagged?"#ff3b3b44":"#1a2e1a",
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{color:d.flagged?"#ff3b3b":"#7aff7a",letterSpacing:1,marginBottom:3}}>{d.name}</div>
                  {d.mac&&<div style={{fontSize:10,color:"#2a5a2a",marginBottom:4}}>{d.mac}</div>}
                  {d.oui&&<ThreatBadge threat={d.oui.threat} type={d.oui.type}/>}
                </div>
                <button onClick={()=>toggleBleFlag(d.id)} style={{
                  ...d.flagged?S.btnRed:S.btnDim,
                  marginLeft:10,flexShrink:0,fontSize:9,padding:"4px 8px",
                }}>
                  {d.flagged?"⚠ FLAGGED":"FLAG"}
                </button>
              </div>
            </div>
          ))}
          {bleDevices.length===0&&(
            <div style={{color:"#1e3a1e",textAlign:"center",padding:20,letterSpacing:2,fontSize:10}}>
              NO BLE DEVICES LOGGED
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
            <button onClick={nav(2)} style={S.btnDim}>← BACK</button>
            <button onClick={nav(4)} style={S.btn}>NEXT →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHASE 4 — TRIANGULATE
          ══════════════════════════════════════════════════════════ */}
      {phase===4&&(
        <div>
          <div style={{color:"#1e4a1e",fontSize:9,letterSpacing:3,marginBottom:12}}>
            PHASE 05 — RSSI TRIANGULATION
          </div>
          <LearnBox text={LEARN.triangulate}/>
          <div style={{...S.card,fontSize:12,color:"#4a7a4a",lineHeight:1.8}}>
            <strong style={{color:"#7aff7a"}}>How:</strong> Pick a suspect device from your WiFi scan. Stand at 3+ positions ~6-8ft apart.
            At each spot, open Marauder → Signal Monitor or use Fing. Record the RSSI for that device.
            The <strong style={{color:"#00ff46"}}>least negative</strong> number = closest position to the device.
          </div>
          <div style={{...S.card,fontSize:11,color:"#2a5a2a",marginTop:2}}>
            RSSI quick guide: &nbsp;
            <span style={{color:"#ff3b3b"}}>-45 = very close</span> &nbsp;
            <span style={{color:"#ff8c00"}}>-65 = same room</span> &nbsp;
            <span style={{color:"#4fc3f7"}}>-85 = far/walls</span>
          </div>

          {positions.map((pos,i)=>{
            const rssiVal=parseInt(pos.rssi);
            const band=pos.rssi&&!isNaN(rssiVal)?getRssiBand(rssiVal):null;
            const isStrongest=strongestPos&&pos.label===strongestPos.label;
            return(
              <div key={i} style={{
                ...S.card,
                borderColor:isStrongest?"#00ff46":band?band.color+"44":"#1a2e1a",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,alignItems:"center"}}>
                  <span style={{letterSpacing:2,fontSize:11,color:isStrongest?"#00ff46":"#4a7a4a"}}>
                    {isStrongest?"► ":""}{pos.label}
                  </span>
                  {isStrongest&&<span style={{fontSize:9,color:"#00ff46",letterSpacing:1,
                    border:"1px solid #00ff4644",padding:"2px 6px"}}>STRONGEST</span>}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:4}}>
                  <input style={{...S.input,width:90,flexShrink:0}} placeholder="-72"
                    value={pos.rssi} type="number"
                    onChange={e=>{const v=e.target.value;setPositions(p=>p.map((x,j)=>j===i?{...x,rssi:v}:x));}}/>
                  <input style={{...S.input}} placeholder="Note (e.g. near window)"
                    value={pos.note}
                    onChange={e=>{const v=e.target.value;setPositions(p=>p.map((x,j)=>j===i?{...x,note:v}:x));}}/>
                </div>
                {band&&<RssiBar value={pos.rssi}/>}
              </div>
            );
          })}

          <button onClick={addPosition} style={{...S.btnDim,width:"100%",marginBottom:10,fontSize:10}}>
            + ADD POSITION
          </button>

          {strongestPos&&(
            <div style={{...S.card,borderColor:"#00ff46",background:"#071207"}}>
              <div style={{fontSize:9,color:"#1e4a1e",letterSpacing:3,marginBottom:8}}>TRIANGULATION RESULT</div>
              <div style={{color:"#00ff46",letterSpacing:2,marginBottom:4,fontSize:13}}>
                SOURCE DIRECTION: {strongestPos.label}
              </div>
              <div style={{color:"#4a7a4a",fontSize:11}}>
                RSSI {strongestPos.rssi} dBm{strongestPos.note?` — ${strongestPos.note}`:""}
              </div>
              <div style={{color:"#2a5a2a",fontSize:10,marginTop:8,lineHeight:1.7}}>
                Move toward this zone and repeat. RSSI narrows the area — wall reflections can shift readings by 5-10 dBm.
              </div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
            <button onClick={nav(3)} style={S.btnDim}>← BACK</button>
            <button onClick={nav(5)} style={S.btn}>NEXT →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PHASE 5 — REPORT
          ══════════════════════════════════════════════════════════ */}
      {phase===5&&(
        <div>
          <div style={{color:"#1e4a1e",fontSize:9,letterSpacing:3,marginBottom:12}}>
            PHASE 06 — SWEEP REPORT
          </div>

          {/* Summary grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {label:"VISUAL CHECKS",    val:`${Object.values(checks).filter(Boolean).length}/${VISUAL_CHECKS.length}`, ok:allVisual},
              {label:"IR RESULT",        val:irResult?irResult.toUpperCase():"NOT RUN", ok:irResult==="clean"},
              {label:"WiFi DEVICES",     val:devices.length,       ok:devices.length===0},
              {label:"WiFi FLAGGED",     val:flaggedDevices.length,ok:flaggedDevices.length===0},
              {label:"BLE DEVICES",      val:bleDevices.length,    ok:bleDevices.length===0},
              {label:"BLE FLAGGED",      val:flaggedBle.length,    ok:flaggedBle.length===0},
              {label:"SUSPECT ZONES",    val:suspectPositions.length,ok:suspectPositions.length===0},
              {label:"FIELD NOTES",      val:findings.length,      ok:true},
            ].map((s,i)=>(
              <div key={i} style={{
                ...S.card,textAlign:"center",padding:"12px 8px",
                borderColor:s.ok?"#1a3a1a":"#3a1a1a",
              }}>
                <div style={{fontSize:9,color:"#2a5a2a",letterSpacing:1,marginBottom:6}}>{s.label}</div>
                <div style={{fontSize:20,color:s.ok?"#00ff46":"#ff3b3b",fontWeight:"bold"}}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Flagged WiFi */}
          {flaggedDevices.length>0&&(
            <div style={{...S.card,borderColor:"#ff3b3b22"}}>
              <div style={{color:"#ff3b3b",fontSize:10,letterSpacing:2,marginBottom:10}}>⚠ FLAGGED WiFi DEVICES</div>
              {flaggedDevices.map(d=>(
                <div key={d.id} style={{marginBottom:8}}>
                  <div style={{color:"#ff8c00",fontSize:12}}>› {d.name} {d.mac&&`[${d.mac}]`}</div>
                  {d.oui&&<div style={{marginTop:2}}><ThreatBadge threat={d.oui.threat} type={d.oui.type}/></div>}
                  {d.rssi&&<RssiBar value={d.rssi}/>}
                </div>
              ))}
            </div>
          )}

          {/* Flagged BLE */}
          {flaggedBle.length>0&&(
            <div style={{...S.card,borderColor:"#ff3b3b22"}}>
              <div style={{color:"#ff3b3b",fontSize:10,letterSpacing:2,marginBottom:10}}>⚠ FLAGGED BLE DEVICES</div>
              {flaggedBle.map(d=>(
                <div key={d.id} style={{marginBottom:8}}>
                  <div style={{color:"#ff8c00",fontSize:12}}>› {d.name} {d.mac&&`[${d.mac}]`}</div>
                  {d.oui&&<div style={{marginTop:2}}><ThreatBadge threat={d.oui.threat} type={d.oui.type}/></div>}
                </div>
              ))}
            </div>
          )}

          {/* Triangulation summary */}
          {strongestPos&&(
            <div style={{...S.card,borderColor:"#1a3a1a"}}>
              <div style={{color:"#2a5a2a",fontSize:9,letterSpacing:2,marginBottom:10}}>TRIANGULATION SUMMARY</div>
              {validPositions.map((p,i)=>(
                <div key={i} style={{
                  display:"flex",justifyContent:"space-between",
                  color:p.label===strongestPos.label?"#00ff46":"#2a5a2a",
                  marginBottom:6,fontSize:12,
                }}>
                  <span>{p.label}</span>
                  <span>{p.rssi} dBm {p.label===strongestPos.label?"◄ STRONGEST":""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Field notes */}
          <div style={S.card}>
            <div style={{color:"#2a5a2a",fontSize:9,letterSpacing:2,marginBottom:10}}>FIELD NOTES</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input style={S.input} placeholder="Add note or finding..."
                value={findingInput} onChange={e=>setFindingInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addFinding()}/>
              <button onClick={addFinding} style={{...S.btn,flexShrink:0,padding:"8px 14px"}}>+</button>
            </div>
            {findings.map((f,i)=>(
              <div key={i} style={{color:"#7aff7a",marginBottom:6,fontSize:12,lineHeight:1.5}}>
                <span style={{color:"#2a5a2a",marginRight:8}}>{f.time}</span>{f.text}
              </div>
            ))}
            {findings.length===0&&<div style={{color:"#1e3a1e",fontSize:10,letterSpacing:2}}>NO FINDINGS LOGGED</div>}
          </div>

          {/* Verdict */}
          <div style={{...S.card,borderColor:verdictColor,textAlign:"center",padding:24}}>
            <div style={{fontSize:9,color:"#2a5a2a",letterSpacing:3,marginBottom:12}}>SWEEP VERDICT</div>
            <div style={{fontSize:28,color:verdictColor,letterSpacing:4,marginBottom:8,
              textShadow:`0 0 20px ${verdictColor}66`}}>
              {verdictLabel}
            </div>
            {isAlert?(
              <div style={{color:"#ff8c00",fontSize:12,lineHeight:1.9}}>
                Flagged signals or IR detected.<br/>
                Physical search required.<br/>
                Photograph any suspicious items.<br/>
                Document for building management.
              </div>
            ):isInconclusive?(
              <div style={{color:"#ffd700",fontSize:12,lineHeight:1.9}}>
                Possible signals detected.<br/>
                Re-sweep recommended.<br/>
                Focus on highest RSSI zone.<br/>
                Consider running burst catcher script.
              </div>
            ):(
              <div style={{color:"#4a7a4a",fontSize:12,lineHeight:1.9}}>
                No confirmed threats detected.<br/>
                All checks passed.<br/>
                Note: wired cameras &amp; SD card cams<br/>
                are not detectable by this tool.
              </div>
            )}
          </div>

          {/* Export */}
          <button onClick={copyReport} style={{
            ...S.btn,width:"100%",marginTop:10,marginBottom:8,
            borderColor:copied?"#00ff46":"#1a3a1a",
            color:copied?"#00ff46":"#3a6a3a",
          }}>
            {copied?"✓ REPORT COPIED TO CLIPBOARD":"📋 COPY FULL REPORT"}
          </button>

          <button onClick={()=>{setPhase(0);setChecks({});setIrResult(null);setDevices([]);
            setBleDevices([]);setPositions([
              {label:"POSITION ALPHA",rssi:"",note:""},
              {label:"POSITION BRAVO",rssi:"",note:""},
              {label:"POSITION CHARLIE",rssi:"",note:""},
            ]);setFindings([]);}} style={{...S.btnDim,width:"100%"}}>
            ↺ NEW SWEEP
          </button>
        </div>
      )}

      <div style={{marginTop:28,fontSize:9,color:"#1a3a1a",letterSpacing:2,textAlign:"center",lineHeight:2}}>
        RF/CAM SWEEP PROTOCOL v2.0<br/>
        FOR DEFENSIVE USE ONLY
      </div>
    </div>
  );
}
