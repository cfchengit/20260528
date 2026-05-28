import { useState, useMemo } from "react";

const COLORS = {
  假日: "#c0392b", 行政會議: "#2471a3", 教學活動: "#3d6b4f",
  招生相關: "#d35400", 學生活動: "#7d3c98", 重要截止: "#b7950b", 學期課程: "#148f77",
};

const EVENTS = [
  {id:1,date:"2026-08-01",name:"本學期開始",cat:"學期課程",note:""},
  {id:2,date:"2026-08-04",name:"舊生初選第1學期課程",cat:"重要截止",note:"含研究所新生，至8/10"},
  {id:3,date:"2026-08-05",name:"校教師評審委員會會議",cat:"行政會議",note:"115學年度"},
  {id:4,date:"2026-08-12",name:"新任系所主管研習會",cat:"教學活動",note:"115學年度"},
  {id:5,date:"2026-08-13",name:"網路查詢註冊",cat:"重要截止",note:"至10月2日"},
  {id:6,date:"2026-08-25",name:"新進職員教育訓練",cat:"教學活動",note:"全面品質管理教育訓練"},
  {id:7,date:"2026-08-26",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:8,date:"2026-08-26",name:"學士班/研究所新生選課",cat:"重要截止",note:"至9月3日"},
  {id:9,date:"2026-09-05",name:"新生暨家長座談會",cat:"學生活動",note:"宿舍住宿生報到進住至9/6"},
  {id:10,date:"2026-09-08",name:"新聘教師教學工作坊",cat:"教學活動",note:"115學年度"},
  {id:11,date:"2026-09-09",name:"新聘教師座談會",cat:"教學活動",note:"境外新生入學輔導講習會"},
  {id:12,date:"2026-09-10",name:"新生開學典禮",cat:"學生活動",note:"克難坡巡禮、系務講習"},
  {id:13,date:"2026-09-10",name:"開始上課",cat:"學期課程",note:"加退選課程至9/22"},
  {id:14,date:"2026-09-16",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:15,date:"2026-09-18",name:"第210次行政會議",cat:"行政會議",note:"校慶工作籌備會議"},
  {id:16,date:"2026-09-23",name:"總量會議",cat:"行政會議",note:"暫訂"},
  {id:17,date:"2026-09-24",name:"淡江品質獎申請",cat:"重要截止",note:"至10月8日"},
  {id:18,date:"2026-09-25",name:"中秋節",cat:"假日",note:"放假一天"},
  {id:19,date:"2026-09-28",name:"教師節",cat:"假日",note:"放假一天"},
  {id:20,date:"2026-10-09",name:"國慶日補假",cat:"假日",note:"逢例假日補放假"},
  {id:21,date:"2026-10-10",name:"國慶日",cat:"假日",note:"放假一天"},
  {id:22,date:"2026-10-21",name:"校課程委員會會議",cat:"行政會議",note:""},
  {id:23,date:"2026-10-23",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:24,date:"2026-10-26",name:"光復節補假",cat:"假日",note:"逢例假日補放假"},
  {id:25,date:"2026-10-27",name:"全學期上課達三分之一",cat:"重要截止",note:"退學退2/3學雜費截止"},
  {id:26,date:"2026-10-27",name:"期中教學意見調查週",cat:"教學活動",note:"至11月8日"},
  {id:27,date:"2026-10-28",name:"教務會議",cat:"行政會議",note:"教育品質管理委員會"},
  {id:28,date:"2026-10-31",name:"教學與行政革新研討會",cat:"教學活動",note:""},
  {id:29,date:"2026-11-02",name:"研究生學位考試申請",cat:"重要截止",note:"至12月11日"},
  {id:30,date:"2026-11-04",name:"學生事務會議",cat:"行政會議",note:"全校陸上運動會"},
  {id:31,date:"2026-11-04",name:"全校陸上運動會",cat:"學生活動",note:""},
  {id:32,date:"2026-11-06",name:"第96次校務會議",cat:"行政會議",note:"審議決算案"},
  {id:33,date:"2026-11-07",name:"校慶慶祝大會",cat:"學生活動",note:"校友返校日"},
  {id:34,date:"2026-11-08",name:"創校76週年校慶紀念日",cat:"學生活動",note:""},
  {id:35,date:"2026-11-09",name:"期中評量成績上傳",cat:"重要截止",note:"至11月30日中午"},
  {id:36,date:"2026-11-11",name:"校教師評審委員會會議",cat:"行政會議",note:"115學年度"},
  {id:37,date:"2026-11-19",name:"班代表座談會",cat:"學生活動",note:"一、四、五年級"},
  {id:38,date:"2026-11-24",name:"防空疏散暨地震演練",cat:"學生活動",note:"台北校園教學大樓"},
  {id:39,date:"2026-11-27",name:"第211次行政會議",cat:"行政會議",note:""},
  {id:40,date:"2026-11-30",name:"全學期上課達三分之二",cat:"重要截止",note:"退學退1/3學雜費截止"},
  {id:41,date:"2026-11-30",name:"期中退選課程",cat:"重要截止",note:"至12月11日"},
  {id:42,date:"2026-12-09",name:"新聘教師員額分配會議",cat:"行政會議",note:""},
  {id:43,date:"2026-12-14",name:"教師教學評量週",cat:"教學活動",note:"至12月27日"},
  {id:44,date:"2026-12-16",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:45,date:"2026-12-18",name:"第212次行政會議",cat:"行政會議",note:"系所主管及學生代表列席"},
  {id:46,date:"2026-12-23",name:"學生校外實習委員會",cat:"行政會議",note:""},
  {id:47,date:"2026-12-24",name:"申請休學截止日",cat:"重要截止",note:""},
  {id:48,date:"2026-12-25",name:"行憲紀念日",cat:"假日",note:"放假一天"},
  {id:49,date:"2026-12-28",name:"期末多元評量週",cat:"教學活動",note:"至1月3日"},
  {id:50,date:"2026-12-30",name:"總量會議",cat:"行政會議",note:"暫訂"},
  {id:51,date:"2027-01-01",name:"開國紀念日",cat:"假日",note:"放假一天"},
  {id:52,date:"2027-01-04",name:"期末多元評量週",cat:"教學活動",note:"教師彈性教學週至1/10"},
  {id:53,date:"2027-01-08",name:"淡江品質獎複審",cat:"行政會議",note:""},
  {id:54,date:"2027-01-11",name:"初選第2學期課程",cat:"重要截止",note:"至1月19日"},
  {id:55,date:"2027-01-12",name:"軍訓室年終工作檢討會",cat:"行政會議",note:"災害防救委員會會議"},
  {id:56,date:"2027-01-13",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:57,date:"2027-01-16",name:"宿舍閉館作業",cat:"學生活動",note:"至1月17日"},
  {id:58,date:"2027-01-18",name:"寒假開始",cat:"假日",note:"至2月21日"},
  {id:59,date:"2027-01-20",name:"學期成績上傳截止",cat:"重要截止",note:"至1月20日中午"},
  {id:60,date:"2027-01-22",name:"總務工作績效評估",cat:"行政會議",note:""},
  {id:61,date:"2027-01-29",name:"歲末聯歡會",cat:"學生活動",note:"115年度"},
  {id:62,date:"2027-01-31",name:"學期結束",cat:"學期課程",note:"第1學期結束"},
  {id:63,date:"2027-02-01",name:"第2學期開始",cat:"學期課程",note:"彈性放假一天"},
  {id:64,date:"2027-02-02",name:"春節假期",cat:"假日",note:"至2月15日"},
  {id:65,date:"2027-02-16",name:"開始上班",cat:"學期課程",note:""},
  {id:66,date:"2027-02-19",name:"學生繳費註冊截止",cat:"重要截止",note:""},
  {id:67,date:"2027-02-20",name:"開始上課",cat:"學期課程",note:"加退選至3/2"},
  {id:68,date:"2027-02-28",name:"和平紀念日",cat:"假日",note:"放假一天"},
  {id:69,date:"2027-03-01",name:"和平紀念日補假",cat:"假日",note:""},
  {id:70,date:"2027-03-02",name:"教育學程申請",cat:"重要截止",note:"至3月18日"},
  {id:71,date:"2027-03-05",name:"第213次行政會議",cat:"行政會議",note:""},
  {id:72,date:"2027-03-06",name:"學系博覽會",cat:"學生活動",note:""},
  {id:73,date:"2027-03-09",name:"轉系、所申請",cat:"重要截止",note:"116學年度，至3/15"},
  {id:74,date:"2027-03-13",name:"春之饗宴",cat:"學生活動",note:"校友返校座談參觀"},
  {id:75,date:"2027-03-19",name:"身心障礙學生升學甄試",cat:"招生相關",note:"至3月21日"},
  {id:76,date:"2027-03-22",name:"期中教學意見調查週",cat:"教學活動",note:"至4月11日"},
  {id:77,date:"2027-03-22",name:"研究生學位考試申請",cat:"重要截止",note:"至5月14日"},
  {id:78,date:"2027-03-24",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:79,date:"2027-03-26",name:"全面品質管理研習會",cat:"教學活動",note:""},
  {id:80,date:"2027-04-04",name:"兒童節",cat:"假日",note:""},
  {id:81,date:"2027-04-05",name:"民俗掃墓節",cat:"假日",note:"放假"},
  {id:82,date:"2027-04-06",name:"兒童節補假",cat:"假日",note:""},
  {id:83,date:"2027-04-07",name:"教學行政觀摩日",cat:"教學活動",note:"至4月9日"},
  {id:84,date:"2027-04-12",name:"全學期上課達三分之一",cat:"重要截止",note:"退學退2/3學雜費截止"},
  {id:85,date:"2027-04-14",name:"畢業典禮籌備會議",cat:"行政會議",note:""},
  {id:86,date:"2027-04-16",name:"第214次行政會議",cat:"行政會議",note:"系所主管及學生代表列席"},
  {id:87,date:"2027-04-19",name:"期中評量成績上傳",cat:"重要截止",note:"至5月10日中午"},
  {id:88,date:"2027-04-21",name:"招生委員會議",cat:"招生相關",note:""},
  {id:89,date:"2027-04-23",name:"教育品質管理委員會",cat:"行政會議",note:""},
  {id:90,date:"2027-04-26",name:"提報學分學程修讀名單",cat:"重要截止",note:"至5月21日"},
  {id:91,date:"2027-04-28",name:"校課程委員會會議",cat:"行政會議",note:""},
  {id:92,date:"2027-04-29",name:"班代表座談會",cat:"學生活動",note:"二、三年級"},
  {id:93,date:"2027-04-30",name:"勞動節補放假",cat:"假日",note:""},
  {id:94,date:"2027-05-01",name:"勞動節",cat:"假日",note:"放假一天"},
  {id:95,date:"2027-05-03",name:"研究生學位考試",cat:"教學活動",note:"至7月4日"},
  {id:96,date:"2027-05-05",name:"學生事務會議",cat:"行政會議",note:""},
  {id:97,date:"2027-05-07",name:"教務會議",cat:"行政會議",note:"教育學程甄選決審"},
  {id:98,date:"2027-05-10",name:"雙主修、輔系申請",cat:"重要截止",note:"至5月31日"},
  {id:99,date:"2027-05-12",name:"校教師評審委員會會議",cat:"行政會議",note:"116學年度"},
  {id:100,date:"2027-05-17",name:"全學期上課達三分之二",cat:"重要截止",note:"退學退1/3學雜費截止"},
  {id:101,date:"2027-05-17",name:"期中退選課程",cat:"重要截止",note:"至5月21日"},
  {id:102,date:"2027-05-19",name:"全校水上運動會",cat:"學生活動",note:""},
  {id:103,date:"2027-05-21",name:"第215次行政會議",cat:"行政會議",note:"預算初審"},
  {id:104,date:"2027-05-24",name:"教師教學評量週",cat:"教學活動",note:"至5月30日(畢業班)"},
  {id:105,date:"2027-05-28",name:"申請休學截止",cat:"重要截止",note:"應屆畢業生"},
  {id:106,date:"2027-06-01",name:"學分學程證明書申請",cat:"重要截止",note:"至6月30日"},
  {id:107,date:"2027-06-02",name:"總務會議",cat:"行政會議",note:"災害防救委員會"},
  {id:108,date:"2027-06-04",name:"第97次校務會議",cat:"行政會議",note:"審議預算案"},
  {id:109,date:"2027-06-05",name:"畢業典禮",cat:"學生活動",note:"補行上班7/8"},
  {id:110,date:"2027-06-07",name:"期末多元評量週",cat:"教學活動",note:"至6月13日"},
  {id:111,date:"2027-06-09",name:"端午節",cat:"假日",note:"放假"},
  {id:112,date:"2027-06-11",name:"學生校外實習委員會",cat:"行政會議",note:""},
  {id:113,date:"2027-06-17",name:"校園安全維護會議",cat:"行政會議",note:""},
  {id:114,date:"2027-06-21",name:"教師彈性教學週",cat:"教學活動",note:"至6月27日"},
  {id:115,date:"2027-06-23",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:116,date:"2027-06-26",name:"宿舍閉館作業",cat:"學生活動",note:"至6月27日"},
  {id:117,date:"2027-06-28",name:"暑假開始",cat:"假日",note:"至開學日"},
  {id:118,date:"2027-06-29",name:"出國留學授旗典禮",cat:"學生活動",note:"116學年度"},
  {id:119,date:"2027-07-08",name:"彈性放假",cat:"假日",note:"6/5補行上班"},
  {id:120,date:"2027-07-26",name:"第2學期成績複查截止",cat:"重要截止",note:""},
  {id:121,date:"2027-07-28",name:"招生委員會會議",cat:"招生相關",note:""},
  {id:122,date:"2027-07-28",name:"本學年度結束",cat:"學期課程",note:"115學年度結束"},
].map(e => ({ ...e, color: COLORS[e.cat] }));

const WEEKDAYS = ["日","一","二","三","四","五","六"];
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function buildCells(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month+1, 0);
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month, 1 - first.getDay() + i);
    cells.push({ date: fmtDate(d), day: d.getDate(), cur: false, dow: d.getDay() });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: fmtDate(dt), day: d, cur: true, dow: dt.getDay() });
  }
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) {
    const d = new Date(year, month+1, i);
    cells.push({ date: fmtDate(d), day: d.getDate(), cur: false, dow: d.getDay() });
  }
  return cells;
}

export default function TKUCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(8);
  const [selected, setSelected] = useState("2026-09-10");
  const [semester, setSemester] = useState("s1");
  const [filterCat, setFilterCat] = useState("全部");
  const today = fmtDate(new Date());

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const getEvents = (date) =>
    EVENTS.filter(e => e.date === date && (filterCat === "全部" || e.cat === filterCat));

  const monthEvents = useMemo(() =>
    EVENTS.filter(e => 
      e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`) && (filterCat === "全部" || e.cat === filterCat)
    ).sort((a,b) => a.date.localeCompare(b.date)),
    [year, month, filterCat]
  );

  const selEvents = getEvents(selected);
  const selDow = selected ? WEEKDAYS[new Date(selected).getDay()] : "";

  function prev() {
    if (month === 0) { setYear(y => y-1); setMonth(11); }
    else setMonth(m => m-1);
  }
  function next() {
    if (month === 11) { setYear(y => y+1); setMonth(0); }
    else setMonth(m => m+1);
  }
  function jumpSemester(s) {
    setSemester(s);
    if (s === "s1") { setYear(2026); setMonth(8); setSelected("2026-09-10"); }
    else { setYear(2027); setMonth(1); setSelected("2027-02-20"); }
  }

  const s = {
    app: { display:"flex", height:"100vh", fontFamily:"'Noto Sans TC',sans-serif", background:"#f5f2ec", color:"#2c2826", overflow:"hidden" },
    sidebar: { width:260, minWidth:260, background:"#fff", borderRight:"1px solid #e5e0d8", display:"flex", flexDirection:"column", overflow:"hidden" },
    sideHead: { padding:"20px 18px 14px", borderBottom:"1px solid #e5e0d8" },
    sideSub: { fontSize:10, letterSpacing:3, color:"#aaa", textTransform:"uppercase", marginBottom:4 },
    sideTitle: { fontSize:17, fontWeight:700 },
    navRow: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderBottom:"1px solid #e5e0d8" },
    navBtn: { background:"none", border:"1px solid #e0dbd3", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:14, color:"#555" },
    semRow: { display:"flex", gap:6, padding:"10px 18px", borderBottom:"1px solid #e5e0d8" },
    semBtn: (active, col) => ({ flex:1, padding:"5px 0", borderRadius:6, border:`1px solid ${active?col:"#e0dbd3"}`, background:active?col:"transparent", color:active?"#fff":"#888", fontSize:11, cursor:"pointer", fontWeight:active?600:400 }),
    legend: { padding:"12px 18px", borderBottom:"1px solid #e5e0d8" },
    legTitle: { fontSize:10, letterSpacing:2, color:"#aaa", textTransform:"uppercase", marginBottom:8 },
    legItem: { display:"flex", alignItems:"center", gap:7, marginBottom:5, fontSize:12, cursor:"pointer" },
    legDot: (col, active) => ({ width:10, height:10, borderRadius:3, background:col, opacity:active?1:0.4, transition:"opacity .15s" }),
    upList: { flex:1, overflowY:"auto", padding:"12px 18px" },
    upTitle: { fontSize:10, letterSpacing:2, color:"#aaa", textTransform:"uppercase", marginBottom:8 },
    upChip: (col) => ({ padding:"8px 10px", borderRadius:7, marginBottom:6, borderLeft:`3px solid ${col}`, background:"#f8f5f0" }),
    upName: { fontSize:12, fontWeight:500, marginBottom:1 },
    upDate: { fontSize:10, color:"#aaa", fontFamily:"monospace" },
    main: { flex:1, overflowY:"auto", padding:"24px 28px" },
    calHdr: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 },
    calTitle: { fontSize:20, fontWeight:700 },
    calMeta: { fontSize:12, color:"#aaa", fontWeight:400, marginLeft:8 },
    grid: { background:"#fff", borderRadius:12, border:"1px solid #e5e0d8", overflow:"hidden" },
    wdRow: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#f8f5f0", borderBottom:"1px solid #e5e0d8" },
    wd: (i) => ({ textAlign:"center", padding:"8px 0", fontSize:10, letterSpacing:2, color: i===0?"#c0392b":i===6?"#2471a3":"#aaa", fontFamily:"monospace" }),
    daysRow: { display:"grid", gridTemplateColumns:"repeat(7,1fr)" },
    cell: (isSel, isToday, cur) => ({
      minHeight:90, padding:"6px 5px", cursor:"pointer",
      borderRight:"1px solid #e5e0d8", borderBottom:"1px solid #e5e0d8",
      background: isSel ? "#eef4ee" : isToday ? "#fffbf0" : "#fff",
      opacity: cur ? 1 : 0.35, transition:"background .1s",
    }),
    dayNum: (isToday, dow) => ({
      fontSize:12, fontWeight:isToday?700:500,
      width:22, height:22, borderRadius:"50%",
      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:3,
      background: isToday ? "#3d6b4f" : "transparent",
      color: isToday ? "#fff" : dow===0 ? "#c0392b" : dow===6 ? "#2471a3" : "#2c2826",
    }),
    pill: (col) => ({
      fontSize:10, padding:"2px 5px", borderRadius:4, marginBottom:2,
      background:col, color:"#fff", whiteSpace:"nowrap", overflow:"hidden",
      textOverflow:"ellipsis", cursor:"pointer",
    }),
    more: { fontSize:9, color:"#aaa", marginTop:1 },
    detail: { background:"#fff", border:"1px solid #e5e0d8", borderRadius:10, padding:"18px", marginTop:18, animation:"fadeIn .2s" },
    detDate: { fontSize:12, color:"#aaa", marginBottom:10, fontFamily:"monospace" },
    detEvent: (col) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, background:"#f8f5f0", borderLeft:`4px solid ${col}`, marginBottom:7 }),
    detName: { fontSize:13, fontWeight:500 },
    detMeta: { fontSize:11, color:"#aaa", marginTop:2, fontFamily:"monospace" },
  };

  return (
    <div style={s.app}>
      {/* SIDEBAR */}
      <div style={s.sidebar}>
        <div style={s.sideHead}>
          <div style={s.sideSub}>淡江大學</div>
          <div style={s.sideTitle}>115學年度行事曆</div>
        </div>

        {/* 月份導覽 */}
        <div style={s.navRow}>
          <button style={s.navBtn} onClick={prev}>‹</button>
          <span style={{fontSize:13, fontFamily:"monospace", fontWeight:600}}>
            {year}.{String(month+1).padStart(2,"0")}
          </span>
          <button style={s.navBtn} onClick={next}>›</button>
        </div>

        {/* 學期切換 */}
        <div style={s.semRow}>
          <button style={s.semBtn(semester==="s1","#2471a3")} onClick={() => jumpSemester("s1")}>第1學期</button>
          <button style={s.semBtn(semester==="s2","#c0392b")} onClick={() => jumpSemester("s2")}>第2學期</button>
        </div>

        {/* 類別篩選 */}
        <div style={s.legend}>
          <div style={s.legTitle}>類別篩選</div>
          <div style={s.legItem} onClick={() => setFilterCat("全部")}>
            <div style={{...s.legDot("#888", filterCat==="全部"), borderRadius:"50%"}}/>
            <span style={{fontSize:12, color: filterCat==="全部"?"#2c2826":"#aaa"}}>全部顯示</span>
          </div>
          {Object.entries(COLORS).map(([cat, col]) => (
            <div key={cat} style={s.legItem} onClick={() => setFilterCat(filterCat===cat?"全部":cat)}>
              <div style={s.legDot(col, filterCat==="全部"||filterCat===cat)}/>
              <span style={{fontSize:12, color: filterCat===cat?col:"#666"}}>{cat}</span>
            </div>
          ))}
        </div>

        {/* 本月事件列表 */}
        <div style={s.upList}>
          <div style={s.upTitle}>本月事件（{monthEvents.length}）</div>
          {monthEvents.slice(0,12).map(ev => (
            <div key={ev.id} style={s.upChip(ev.color)} onClick={() => setSelected(ev.date)}>
              <div style={s.upName}>{ev.name}</div>
              <div style={s.upDate}>{ev.date}</div>
            </div>
          ))}
          {monthEvents.length > 12 && <div style={{fontSize:11,color:"#aaa",textAlign:"center"}}>+{monthEvents.length-12} 更多…</div>}
        </div>
      </div>

      {/* MAIN */}
      <div style={s.main}>
        <div style={s.calHdr}>
          <h1 style={s.calTitle}>
            {year} 年 {MONTHS[month]}
            <span style={s.calMeta}>（{monthEvents.length} 個事件）</span>
          </h1>
        </div>

        <div style={s.grid}>
          {/* 週標題 */}
          <div style={s.wdRow}>
            {WEEKDAYS.map((d,i) => <div key={d} style={s.wd(i)}>{d}</div>)}
          </div>
          {/* 日期格 */}
          <div style={s.daysRow}>
            {cells.map((cell, idx) => {
              const evs = getEvents(cell.date);
              const isToday = cell.date === today;
              const isSel = cell.date === selected;
              return (
                <div
                  key={idx}
                  style={{
                    ...s.cell(isSel, isToday, cell.cur),
                    borderRight: (idx+1)%7===0 ? "none" : "1px solid #e5e0d8",
                  }}
                  onClick={() => setSelected(cell.date)}
                >
                  <div style={s.dayNum(isToday, cell.dow)}>{cell.day}</div>
                  {evs.slice(0,3).map(ev => (
                    <div key={ev.id} style={s.pill(ev.color)} title={ev.name}>{ev.name}</div>
                  ))}
                  {evs.length > 3 && <div style={s.more}>+{evs.length-3} 更多</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 選取日期詳情 */}
        {selected && (
          <div style={s.detail}>
            <div style={s.detDate}>📅 {selected}（{selDow}）</div>
            {selEvents.length === 0 ? (
              <div style={{fontSize:13, color:"#aaa", padding:"8px 0"}}>這天沒有行事曆事件。</div>
            ) : selEvents.map(ev => (
              <div key={ev.id} style={s.detEvent(ev.color)}>
                <div style={{flex:1}}>
                  <div style={s.detName}>{ev.name}</div>
                  <div style={s.detMeta}>{ev.cat}{ev.note ? " ｜ " + ev.note : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
