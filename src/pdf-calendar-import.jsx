import { useState, useCallback, useRef } from "react";

// ── 常數 ──
const COLORS = {
  假日:"#c0392b", 行政會議:"#2471a3", 教學活動:"#3d6b4f",
  招生相關:"#d35400", 學生活動:"#7d3c98", 重要截止:"#b7950b",
  學期課程:"#148f77", 其他:"#7f8c8d",
};
const CAT_LIST = Object.keys(COLORS);
const WEEKDAYS = ["日","一","二","三","四","五","六"];

const CAT_RULES = [
  ["假日",   ["放假","假期","春節","國慶","中秋","兒童節","端午","掃墓","補假","寒假","暑假","小年夜"]],
  ["行政會議",["行政會議","校務會議","教務會議","委員會","招生委員","評審委員","總量會議"]],
  ["教學活動",["評量","工作坊","研習","研討","觀摩","上課","選課","加退選","講習"]],
  ["招生相關",["招生","甄試","入學","轉系","轉所"]],
  ["學生活動",["座談","運動會","校慶","畢業典禮","新生","開學","宿舍","社團","返校","博覽","聯歡","授旗"]],
  ["重要截止",["截止","休學","退選","成績上傳","繳費","初選","閉館","複查"]],
  ["學期課程",["學期","本學期","開始上班","學年度結束"]],
];
function classify(name) {
  for (const [cat, kws] of CAT_RULES)
    if (kws.some(k => name.includes(k))) return cat;
  return "其他";
}

// ── PDF 解析 ──
const EVT_RE = /(\d{1,2})\s+((?:\d+)?[\u4e00-\u9fff（(【].{2,})/g;
const CJK_RE = /[\u4e00-\u9fff]/g;
const SKIP_RES = [/^月份\s*週次/,/^一\s+二\s+三\s+四/,/行政會議通過$/,/^月\s*曆$/,/^民國$/,/^11[56]年?$/,/^淡江大學/];

function checkEncoding(text) {
  const cjk = (text.match(CJK_RE)||[]).length;
  const total = text.replace(/\s/g,'').length;
  return total > 0 ? cjk / total : 0;
}

function parseEvents(text) {
  const lines = text.split(/\n/).map(l=>l.trim()).filter(Boolean);
  const events = [];
  let eid=1, year=2026, month=8, lastDay=0;
  for (const line of lines) {
    if (SKIP_RES.some(r=>r.test(line))) continue;
    const stripped = line.replace(/[一二三四五六七八九十\s\d]/g,"");
    if (stripped.length < 2) continue;
    const allMatches = [...line.matchAll(EVT_RE)];
    const valid = allMatches.filter(m=>(m[2].match(CJK_RE)||[]).length >= 2);
    if (valid.length > 0) {
      const m = valid[valid.length-1];
      const day = parseInt(m[1]);
      const desc = m[2].trim();
      if (day>=1 && day<=31 && desc.length>=2) {
        if (lastDay>0 && day<lastDay && (lastDay-day)>8) {
          month++; if (month>12){month=1;year++;}
        }
        lastDay = day;
        const date = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const cat = classify(desc);
        events.push({id:eid++, date, name:desc.slice(0,28), cat, color:COLORS[cat], note:desc});
      }
    } else if ((line.match(CJK_RE)||[]).length>=2 && lastDay>0) {
      const date = `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
      const cat = classify(line);
      events.push({id:eid++, date, name:line.slice(0,28), cat, color:COLORS[cat], note:line});
    }
  }
  return events;
}

// ── 月曆工具 ──
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function buildCells(year, month) {
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const cells=[];
  for(let i=0;i<first.getDay();i++){const d=new Date(year,month,1-first.getDay()+i);cells.push({date:fmtDate(d),day:d.getDate(),cur:false,dow:d.getDay()});}
  for(let d=1;d<=last.getDate();d++){const dt=new Date(year,month,d);cells.push({date:fmtDate(dt),day:d,cur:true,dow:dt.getDay()});}
  while(cells.length%7!==0){const i=cells.length-first.getDay()-last.getDate()+1;const d=new Date(year,month+1,i);cells.push({date:fmtDate(d),day:d.getDate(),cur:false,dow:d.getDay()});}
  return cells;
}

// ── 空白表單 ──
const BLANK_FORM = { date:"", name:"", cat:"學生活動", note:"", time:"" };

// ── 預設行事曆資料 ──
const DEFAULT_EVENTS = [
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

// ══════════════════════════════════
export default function PDFCalendar() {
  const [events,    setEvents]    = useState(DEFAULT_EVENTS);
  const [year,      setYear]      = useState(2026);
  const [month,     setMonth]     = useState(8);
  const [selected,  setSelected]  = useState(null);
  const [filterCat, setFilterCat] = useState("全部");
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState(null);
  const [tab,       setTab]       = useState("pdf");   // pdf | manual
  const [form,      setForm]      = useState(BLANK_FORM);
  const [formMsg,   setFormMsg]   = useState("");
  const [drag,      setDrag]      = useState(false);
  const today = fmtDate(new Date());
  const nextId = useRef(10000);

  // ── PDF 匯入 ──
  const loadPdfJs = () => new Promise((res,rej)=>{
    if(window.pdfjsLib){res(window.pdfjsLib);return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";res(window.pdfjsLib);};
    s.onerror=rej; document.head.appendChild(s);
  });

  const handleFile = useCallback(async(file)=>{
    if(!file||file.type!=="application/pdf"){setStatus({type:"error",msg:"❌ 請選擇 PDF 檔案"});return;}
    setLoading(true); setStatus({type:"info",msg:"⏳ 讀取 PDF 中..."});
    try {
      const lib = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await lib.getDocument({data:buf}).promise;
      let text="";
      for(let p=1;p<=pdf.numPages;p++){
        const page=await pdf.getPage(p);
        const tc=await page.getTextContent();
        text+=tc.items.map(i=>i.str).join("\n")+"\n";
      }
      // 偵測字型編碼
      const ratio = checkEncoding(text);
      if(ratio < 0.1) {
        setStatus({type:"warn",
          msg:`⚠️ 此 PDF 使用自訂字型加密（中文辨識率僅 ${(ratio*100).toFixed(1)}%），無法自動解析。\n請改用「手動輸入」標籤逐筆新增，或改用 115 學年度格式的 PDF。`});
        setLoading(false); return;
      }
      setStatus({type:"info",msg:"⏳ 解析事件中..."});
      const parsed = parseEvents(text);
      if(parsed.length===0){
        setStatus({type:"warn",msg:"⚠️ 未能解析到事件，請確認 PDF 為文字型（非掃描版）。"});
      } else {
        const merged = [...events, ...parsed.map(e=>({...e, id:nextId.current++}))];
        setEvents(merged);
        const fd = parsed[0].date;
        setYear(parseInt(fd.slice(0,4))); setMonth(parseInt(fd.slice(5,7))-1);
        setStatus({type:"ok",msg:`✅ 成功匯入 ${parsed.length} 筆事件！目前共 ${merged.length} 筆。`});
      }
    } catch(e){setStatus({type:"error",msg:"❌ 讀取失敗："+e.message});}
    setLoading(false);
  },[events]);

  const onDrop = useCallback(e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);},[handleFile]);

  // ── 下載文字範例 ──
  const downloadSample = () => {
    const content = `校園行事曆範例格式（可解析的 PDF 文字格式）
====================================================
115 學年度第 1 學期行事曆（2026年8月 ─ 2027年1月）
====================================================

月份 週次 日期 事  項

8月
1 本學期開始
4 舊生初選第1學期課程(含研究所新生)【至8月10日】
5 115學年度校教師評審委員會會議
12 115學年度新任系所主管研習會
25 115學年度新進職員教育訓練，全面品質管理教育訓練
26 招生委員會會議
學士班新生、研究所新生選課【至9月3日】

9月
5 新生暨家長座談會、淡水校園學生宿舍住宿生報到、進住【至9月6日】
8 115學年度新聘教師教學工作坊
9 115學年度新聘教師座談會，境外新生入學輔導講習會
10 文、工、外語、教育學院各系所克難坡巡禮、新生開學典禮及系務講習
10 開始上課，加退選課程【至9月22日】
16 招生委員會會議
18 第210次行政會議，校慶工作籌備會議
25 中秋節(放假一天)
28 教師節(放假一天)

10月
9 國慶日逢例假日補放假
10 國慶日(放假一天)
21 校課程委員會會議
27 全學期上課達三分之一(休、退學學生退2/3學雜費截止)
27 期中教學意見調查週【至11月8日】
28 教務會議、教育品質管理委員會
31 教學與行政革新研討會

11月
4 學生事務會議，全校陸上運動會
6 第96次校務會議(審議決算案)
7 創校76週年校慶慶祝大會、校友返校日
9 期中評量成績上傳【至11月30日中午】
27 第211次行政會議

12月
14 教師教學評量週【至12月27日】
18 第212次行政會議(系所主管及學生代表列席)
25 行憲紀念日(放假一天)
28 期末多元評量週【至1月3日】

1月（民國116年）
1 開國紀念日(放假一天)
11 初選第2學期課程【至1月19日】
18 寒假【至2月21日】
31 學期結束

====================================================
115 學年度第 2 學期行事曆（2027年2月 ─ 2027年7月）
====================================================

2月
1 本學期開始，彈性放假一天
2 春節假期(02/02~02/15)
20 開始上課，加退選課程【至3月2日】
28 和平紀念日(放假一天)

3月
1 和平紀念日逢例假日補放假
5 第213次行政會議
6 學系博覽會
22 期中教學意見調查週【至4月11日】
24 招生委員會會議

4月
4 兒童節
5 民俗掃墓節(放假)
7 教學行政觀摩日【至4月9日】
16 第214次行政會議
21 招生委員會議

5月
1 勞動節(放假一天)
5 學生事務會議
12 116學年度校教師評審委員會會議
17 全學期上課達三分之二(休、退學學生退1/3學雜費截止)
19 全校水上運動會
21 第215次行政會議(預算初審)

6月
5 畢業典禮
9 端午節(放假)
28 暑假【至開學日】

7月
26 第2學期成績複查截止日
28 本學年度結束

====================================================
格式說明：
- 每行格式：「日期數字 空格 事件描述」
- 換月時日期數字會自動重置（系統自動偵測）
- 備註可用括號或【】標示
- 描述需包含中文字（純數字行會被跳過）
====================================================
`;
    const blob = new Blob([content], {type:"text/plain;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "calendar-format-sample.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── 匯出功能 ──
  const [exportMsg,  setExportMsg]  = useState("");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo,   setExportTo]   = useState("");
  const [exportCat,  setExportCat]  = useState("全部");

  // 依時間範圍與類別篩選
  const exportScope = events.filter(e => {
    if(exportCat !== "全部" && e.cat !== exportCat) return false;
    if(exportFrom && e.date < exportFrom) return false;
    if(exportTo   && e.date > exportTo)   return false;
    return true;
  }).sort((a,b) => a.date.localeCompare(b.date));

  const dl = (content, filename, mime) => {
    const blob = new Blob([content], {type: mime});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const rangeLabel = () => {
    if(!exportFrom && !exportTo) return "全部";
    if(exportFrom && exportTo) return `${exportFrom} ～ ${exportTo}`;
    if(exportFrom) return `${exportFrom} 之後`;
    return `${exportTo} 之前`;
  };

  // ① 排版 HTML 文件（可列印/存成 PDF）
  const exportHTML = () => {
    if(!exportScope.length){setExportMsg("⚠️ 篩選範圍內沒有事件");return;}
    const CAT_COLOR = {假日:"#c0392b",行政會議:"#2471a3",教學活動:"#3d6b4f",招生相關:"#d35400",學生活動:"#7d3c98",重要截止:"#b7950b",學期課程:"#148f77",其他:"#7f8c8d"};
    let lastMonth = "";
    let bodyHTML = "";
    for(const ev of exportScope){
      const ym = ev.date.slice(0,7);
      if(ym !== lastMonth){
        if(lastMonth) bodyHTML += `</tbody></table>`;
        const y = ev.date.slice(0,4), m = parseInt(ev.date.slice(5,7));
        bodyHTML += `<h2 class="month-header">${y} 年 ${m} 月</h2>
          <table><thead><tr><th>日期</th><th>事件名稱</th><th>類別</th><th>備註</th></tr></thead><tbody>`;
        lastMonth = ym;
      }
      const dow = ["日","一","二","三","四","五","六"][new Date(ev.date).getDay()];
      const col = CAT_COLOR[ev.cat]||"#888";
      bodyHTML += `<tr>
        <td class="date-cell">${ev.date}（${dow}）</td>
        <td>${ev.name}</td>
        <td><span class="tag" style="background:${col}18;color:${col};border:1px solid ${col}40">${ev.cat}</span></td>
        <td class="note">${ev.note&&ev.note!==ev.name?ev.note:""}</td>
      </tr>`;
    }
    if(lastMonth) bodyHTML += `</tbody></table>`;
    const html = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8">
<title>校園行事曆 ${rangeLabel()}</title>
<style>
  body{font-family:'微軟正黑體','Noto Sans TC',sans-serif;max-width:900px;margin:0 auto;padding:32px;color:#2c2826;font-size:13px;}
  .cover{text-align:center;padding:40px 0 30px;border-bottom:3px solid #2c2826;margin-bottom:32px;}
  .cover h1{font-size:24px;margin:0 0 8px;}
  .cover .meta{color:#888;font-size:12px;}
  .month-header{font-size:16px;font-weight:700;color:#2471a3;margin:28px 0 8px;padding-left:10px;border-left:4px solid #2471a3;}
  table{width:100%;border-collapse:collapse;margin-bottom:8px;}
  th{background:#f5f2ec;padding:7px 10px;text-align:left;font-size:11px;letter-spacing:1px;color:#888;font-weight:600;border-bottom:2px solid #e5e0d8;}
  td{padding:7px 10px;border-bottom:1px solid #f0ede7;vertical-align:top;}
  tr:hover td{background:#faf8f4;}
  .date-cell{white-space:nowrap;font-family:monospace;font-size:12px;color:#555;}
  .tag{display:inline-block;padding:2px 7px;border-radius:8px;font-size:11px;white-space:nowrap;}
  .note{color:#888;font-size:12px;}
  .summary{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;}
  .stat{padding:10px 16px;border-radius:8px;background:#f5f2ec;text-align:center;min-width:80px;}
  .stat-num{font-size:22px;font-weight:700;color:#2471a3;}
  .stat-label{font-size:10px;color:#aaa;margin-top:2px;}
  @media print{body{padding:16px;}thead{display:table-header-group;}}
</style></head><body>
<div class="cover">
  <h1>校園行事曆</h1>
  <div class="meta">匯出範圍：${rangeLabel()}　·　類別：${exportCat}　·　共 ${exportScope.length} 筆事件</div>
  <div class="meta">匯出時間：${new Date().toLocaleString("zh-TW")}</div>
</div>
<div class="summary">
  ${Object.entries(CAT_COLOR).map(([cat,col])=>{
    const n=exportScope.filter(e=>e.cat===cat).length;
    return n>0?`<div class="stat"><div class="stat-num" style="color:${col}">${n}</div><div class="stat-label">${cat}</div></div>`:"";
  }).join("")}
</div>
${bodyHTML}
</body></html>`;
    dl(html, "calendar-document.html", "text/html;charset=utf-8");
    setExportMsg(`✅ 已匯出排版文件（${exportScope.length} 筆）→ 用瀏覽器開啟，可列印或儲存為 PDF`);
  };

  // ② 系統相容 CSV（可重新匯入本系統）
  const exportSystemCSV = () => {
    if(!exportScope.length){setExportMsg("⚠️ 篩選範圍內沒有事件");return;}
    const BOM = "\uFEFF";
    const header = "date,name,cat,note,time,color";
    const rows = exportScope.map(e => [
      e.date,
      `"${e.name.replace(/"/g,'""')}"`,
      e.cat,
      `"${(e.note||"").replace(/"/g,'""')}"`,
      e.time||"",
      e.color
    ].join(","));
    dl(BOM+[header,...rows].join("\r\n"), "calendar-reimport.csv", "text/csv;charset=utf-8");
    setExportMsg(`✅ 已匯出系統相容 CSV（${exportScope.length} 筆）→ 可重新匯入本行事曆系統`);
  };

  // ③ Excel 瀏覽用 CSV
  const exportExcelCSV = () => {
    if(!exportScope.length){setExportMsg("⚠️ 篩選範圍內沒有事件");return;}
    const BOM = "\uFEFF";
    const header = "日期,星期,事件名稱,分類,時間,備註";
    const rows = exportScope.map(e=>{
      const dow=["日","一","二","三","四","五","六"][new Date(e.date).getDay()];
      return [e.date,dow,`"${e.name.replace(/"/g,'""')}"`,e.cat,e.time||"",`"${(e.note||"").replace(/"/g,'""')}"`].join(",");
    });
    dl(BOM+[header,...rows].join("\r\n"), "calendar-excel.csv", "text/csv;charset=utf-8");
    setExportMsg(`✅ 已匯出 Excel CSV（${exportScope.length} 筆）→ 可用 Excel / Google 試算表開啟`);
  };

  // ④ iCal 行事曆格式
  const exportICS = () => {
    if(!exportScope.length){setExportMsg("⚠️ 篩選範圍內沒有事件");return;}
    const stamp = new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//校園行事曆//ZH","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:校園行事曆","X-WR-TIMEZONE:Asia/Taipei"];
    exportScope.forEach((ev,i)=>{
      const [y,m,d] = ev.date.split("-");
      const next = new Date(ev.date); next.setDate(next.getDate()+1);
      const dtEnd = `${next.getFullYear()}${String(next.getMonth()+1).padStart(2,"0")}${String(next.getDate()).padStart(2,"0")}`;
      lines.push("BEGIN:VEVENT",`DTSTART;VALUE=DATE:${y}${m}${d}`,`DTEND;VALUE=DATE:${dtEnd}`,`DTSTAMP:${stamp}`,`UID:cal-${i}-${y}${m}${d}@calendar`,`SUMMARY:【${ev.cat}】${ev.name}`,`CATEGORIES:${ev.cat}`);
      if(ev.note&&ev.note!==ev.name) lines.push(`DESCRIPTION:${ev.note.replace(/\n/g,"\\n")}`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    dl(lines.join("\r\n"), "calendar-events.ics", "text/calendar;charset=utf-8");
    setExportMsg(`✅ 已匯出 iCal（${exportScope.length} 筆）→ 可匯入 Google / Apple 行事曆 / Outlook`);
  };

  // ⑤ JSON 完整備份
  const exportJSON = () => {
    if(!exportScope.length){setExportMsg("⚠️ 篩選範圍內沒有事件");return;}
    const data = {version:"1.0", exportDate:new Date().toISOString(), range:{from:exportFrom||"全部",to:exportTo||"全部"}, category:exportCat, total:exportScope.length, events:exportScope};
    dl(JSON.stringify(data, null, 2), "calendar-backup.json", "application/json");
    setExportMsg(`✅ 已匯出 JSON 備份（${exportScope.length} 筆）`);
  };

  // ── 手動新增 ──
  const submitForm = () => {
    if(!form.date||!form.name.trim()){setFormMsg("⚠️ 請填寫日期與事件名稱");return;}
    const color = form.cat==="其他"? COLORS["其他"] : (COLORS[form.cat]||COLORS["其他"]);
    const ev = { id:nextId.current++, date:form.date, name:form.name.trim().slice(0,28),
      cat:form.cat, color, note:form.note, time:form.time };
    setEvents(prev=>[...prev, ev]);
    setYear(parseInt(form.date.slice(0,4)));
    setMonth(parseInt(form.date.slice(5,7))-1);
    setSelected(form.date);
    setForm({...BLANK_FORM, date:form.date, cat:form.cat}); // 保留日期和分類，方便連續輸入
    setFormMsg(`✅ 已新增「${ev.name}」，共 ${events.length+1} 筆`);
  };

  const deleteEvent = (id) => setEvents(prev=>prev.filter(e=>e.id!==id));
  const clearAll = () => { if(window.confirm("確定清除所有事件？"))setEvents([]); };

  // ── 月曆資料 ──
  const getEvents = (date) => events.filter(e=>e.date===date&&(filterCat==="全部"||e.cat===filterCat));
  const monthEvents = events.filter(e => 
    e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`) && (filterCat === "全部" || e.cat === filterCat)
  ).sort((a,b) => a.date.localeCompare(b.date));
  const cells = buildCells(year, month);
  const selEvents = selected?getEvents(selected):[];

  // ── 樣式 ──
  const S = {
    wrap:   {display:"flex",height:"100vh",fontFamily:"'Noto Sans TC',system-ui,sans-serif",background:"#f5f2ec",color:"#2c2826",overflow:"hidden"},
    side:   {width:264,background:"#fff",borderRight:"1px solid #e5e0d8",display:"flex",flexDirection:"column",overflow:"hidden"},
    sHd:    {padding:"18px 16px 12px",borderBottom:"1px solid #e5e0d8"},
    sSub:   {fontSize:10,letterSpacing:3,color:"#aaa",textTransform:"uppercase",marginBottom:4},
    sTtl:   {fontSize:16,fontWeight:700},
    sInfo:  {fontSize:11,color:"#aaa",marginTop:2},
    navRow: {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",borderBottom:"1px solid #e5e0d8"},
    navBtn: {background:"none",border:"1px solid #e0dbd3",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:14,color:"#555"},
    legRow: {display:"flex",flexWrap:"wrap",gap:5,padding:"10px 14px",borderBottom:"1px solid #e5e0d8"},
    legBtn: (a,c)=>({fontSize:10,padding:"3px 8px",borderRadius:10,border:`1px solid ${a?c:"#e0dbd3"}`,background:a?c:"transparent",color:a?"#fff":"#888",cursor:"pointer"}),
    upList: {flex:1,overflowY:"auto",padding:"10px 14px"},
    upTtl:  {fontSize:10,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:8},
    upChip: (c)=>({padding:"7px 8px",borderRadius:6,marginBottom:5,borderLeft:`3px solid ${c}`,background:"#f8f5f0",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}),
    main:   {flex:1,overflowY:"auto",padding:"20px 24px"},
    tabs:   {display:"flex",gap:0,marginBottom:16,border:"1px solid #e5e0d8",borderRadius:10,overflow:"hidden"},
    tabBtn: (a)=>({flex:1,padding:"10px",border:"none",background:a?"#2c2826":"#fff",color:a?"#fff":"#888",cursor:"pointer",fontSize:13,fontWeight:a?600:400,transition:"all .15s"}),
    // PDF tab
    drop:   (d)=>({border:`2px dashed ${d?"#3d6b4f":"#c8c3bb"}`,borderRadius:12,padding:"24px 16px",textAlign:"center",marginBottom:12,background:d?"#eef4ee":"#faf8f4",cursor:"pointer",transition:"all .2s"}),
    statusBox: (t)=>({padding:"10px 14px",borderRadius:8,fontSize:12,marginBottom:14,lineHeight:1.5,
      background: t==="ok"?"#eef4ee":t==="warn"?"#fef9ec":t==="error"?"#fef0ef":"#f0ede7",
      color:      t==="ok"?"#2d6a3f":t==="warn"?"#92610a":t==="error"?"#8b2020":"#555",
      whiteSpace:"pre-line",
    }),
    // Manual tab
    formCard: {background:"#fff",border:"1px solid #e5e0d8",borderRadius:12,padding:18,marginBottom:14},
    formRow: {marginBottom:12},
    fLabel: {fontSize:11,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:5,display:"block"},
    fInput: {width:"100%",padding:"8px 10px",border:"1px solid #e0dbd3",borderRadius:7,fontSize:13,fontFamily:"inherit",color:"#2c2826",background:"#faf8f4",outline:"none",boxSizing:"border-box"},
    fSelect:{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd3",borderRadius:7,fontSize:13,fontFamily:"inherit",color:"#2c2826",background:"#faf8f4",outline:"none"},
    addBtn: {width:"100%",padding:"10px",border:"none",borderRadius:8,background:"#3d6b4f",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
    formMsg:{fontSize:12,padding:"8px 10px",borderRadius:7,background:"#eef4ee",color:"#2d6a3f",marginTop:10},
    // Calendar
    calHdr: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},
    grid:   {background:"#fff",borderRadius:12,border:"1px solid #e5e0d8",overflow:"hidden"},
    wdRow:  {display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#f8f5f0",borderBottom:"1px solid #e5e0d8"},
    cell:   (s,t,c)=>({minHeight:80,padding:"5px 4px",cursor:"pointer",borderBottom:"1px solid #e5e0d8",background:s?"#eef4ee":t?"#fffbf0":"#fff",opacity:c?1:0.35}),
    dNum:   (t,d)=>({fontSize:11,fontWeight:t?700:500,width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:2,background:t?"#3d6b4f":"transparent",color:t?"#fff":d===0?"#c0392b":d===6?"#2471a3":"#2c2826"}),
    pill:   (c)=>({fontSize:9,padding:"1px 4px",borderRadius:3,marginBottom:2,background:c,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}),
    detail: {background:"#fff",border:"1px solid #e5e0d8",borderRadius:10,padding:16,marginTop:14},
    detEv:  (c)=>({padding:"9px 12px",borderRadius:8,background:"#f8f5f0",borderLeft:`4px solid ${c}`,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}),
    delBtn: {background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:14,padding:"0 4px",flexShrink:0},
  };

  return (
    <div style={S.wrap}>
      {/* ══ SIDEBAR ══ */}
      <div style={S.side}>
        <div style={S.sHd}>
          <div style={S.sSub}>校園行事曆</div>
          <div style={S.sTtl}>行事曆管理系統</div>
          <div style={S.sInfo}>共 {events.length} 筆事件</div>
        </div>
        <div style={S.navRow}>
          <button style={S.navBtn} onClick={()=>month===0?(setYear(y=>y-1),setMonth(11)):setMonth(m=>m-1)}>‹</button>
          <span style={{fontSize:12,fontFamily:"monospace",fontWeight:600}}>{year}.{String(month+1).padStart(2,"0")}</span>
          <button style={S.navBtn} onClick={()=>month===11?(setYear(y=>y+1),setMonth(0)):setMonth(m=>m+1)}>›</button>
        </div>
        <div style={S.legRow}>
          <button style={S.legBtn(filterCat==="全部","#555")} onClick={()=>setFilterCat("全部")}>全部</button>
          {Object.entries(COLORS).map(([cat,col])=>(
            <button key={cat} style={S.legBtn(filterCat===cat,col)} onClick={()=>setFilterCat(filterCat===cat?"全部":cat)}>{cat}</button>
          ))}
        </div>
        <div style={S.upList}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={S.upTtl}>本月 ({monthEvents.length})</div>
            {events.length>0&&<button onClick={clearAll} style={{fontSize:10,color:"#ccc",background:"none",border:"none",cursor:"pointer",padding:0}}>清除全部</button>}
          </div>
          {monthEvents.length===0&&<div style={{fontSize:12,color:"#aaa"}}>{events.length===0?"尚無事件，請匯入或新增":"這個月沒有事件"}</div>}
          {monthEvents.slice(0,15).map(ev=>(
            <div key={ev.id} style={S.upChip(ev.color)} onClick={()=>{setSelected(ev.date);setYear(parseInt(ev.date.slice(0,4)));setMonth(parseInt(ev.date.slice(5,7))-1);}}>
              <div>
                <div style={{fontSize:11,fontWeight:500,marginBottom:1}}>{ev.name}</div>
                <div style={{fontSize:10,color:"#aaa",fontFamily:"monospace"}}>{ev.date}</div>
              </div>
            </div>
          ))}
          {monthEvents.length>15&&<div style={{fontSize:11,color:"#aaa",textAlign:"center"}}>+{monthEvents.length-15} 更多</div>}
        </div>
      </div>

      {/* ══ MAIN ══ */}
      <div style={S.main}>
        {/* 功能標籤列 */}
        <div style={S.tabs}>
          <button style={S.tabBtn(tab==="pdf")}    onClick={()=>setTab("pdf")}>📄 PDF 匯入</button>
          <button style={S.tabBtn(tab==="manual")} onClick={()=>setTab("manual")}>✏️ 手動輸入</button>
          <button style={S.tabBtn(tab==="export")} onClick={()=>setTab("export")}>⬇️ 匯出</button>
          <button style={S.tabBtn(tab==="cal")}    onClick={()=>setTab("cal")}>📅 行事曆</button>
        </div>

        {/* ── PDF 匯入頁 ── */}
        {tab==="pdf" && (
          <div>
            <label style={S.drop(drag)}
              onDragOver={e=>{e.preventDefault();setDrag(true)}}
              onDragLeave={()=>setDrag(false)}
              onDrop={onDrop}>
              <input type="file" accept=".pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
              <div style={{fontSize:28,marginBottom:6}}>{loading?"⏳":"📄"}</div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{loading?"解析中...":"點擊或拖曳 PDF 行事曆"}</div>
              <div style={{fontSize:11,color:"#aaa"}}>支援 115 學年度標準字型格式・可重複匯入（事件累加）</div>
            </label>
            {status && <div style={S.statusBox(status.type)}>{status.msg}</div>}
            {/* 範例下載區 */}
            <div style={{background:"#fff",border:"1px solid #e5e0d8",borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,color:"#2c2826",marginBottom:10}}>📥 下載範例檔案</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={downloadSample} style={{padding:"12px 10px",borderRadius:10,border:"1px solid #3d6b4f",background:"#f0f6f2",cursor:"pointer",textAlign:"left"}}>
                  <div style={{fontSize:20,marginBottom:4}}>📄</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#3d6b4f",marginBottom:2}}>文字格式範例</div>
                  <div style={{fontSize:10,color:"#888"}}>下載 .txt 說明檔</div>
                  <div style={{fontSize:9,color:"#aaa",marginTop:4}}>可用記事本開啟・參考格式說明</div>
                </button>
                <div style={{padding:"12px 10px",borderRadius:10,border:"1px solid #e5e0d8",background:"#f8f5f0",textAlign:"left"}}>
                  <div style={{fontSize:20,marginBottom:4}}>🗂️</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#555",marginBottom:2}}>PDF 範例（上方下載）</div>
                  <div style={{fontSize:10,color:"#888"}}>calendar-sample.pdf</div>
                  <div style={{fontSize:9,color:"#aaa",marginTop:4}}>包含第1學期完整事件・可直接匯入測試</div>
                </div>
              </div>
            </div>
            {/* 格式說明 */}
            <div style={{background:"#faf8f4",border:"1px solid #e5e0d8",borderRadius:10,padding:14,fontSize:12,color:"#888",lineHeight:1.8}}>
              <div style={{fontWeight:600,color:"#555",marginBottom:8}}>📋 PDF 格式說明</div>
              <div>✅ <b style={{color:"#3d6b4f"}}>可解析：</b>標準字型，每行「日期 事件名稱」，中文比例 &gt; 10%</div>
              <div>✅ <b style={{color:"#3d6b4f"}}>可解析：</b>淡江大學 115 學年度格式、自製標準 PDF</div>
              <div>❌ <b style={{color:"#c0392b"}}>無法解析：</b>114 學年度自訂字型加密（中文顯示亂碼）</div>
              <div>❌ <b style={{color:"#c0392b"}}>無法解析：</b>掃描圖片型 PDF、密碼保護 PDF</div>
              <div style={{marginTop:4}}>💡 無法解析時，請切換至「手動輸入」標籤逐筆新增。</div>
            </div>
          </div>
        )}

        {/* ── 匯出頁 ── */}
        {tab==="export" && (
          <div>
            {/* 篩選條件區 */}
            <div style={{background:"#fff",border:"1px solid #e5e0d8",borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>🔍 設定匯出範圍</div>

              {/* 時間範圍 */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:8}}>時間範圍</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,color:"#aaa",marginBottom:4}}>開始日期</div>
                    <input type="date" value={exportFrom} onChange={e=>setExportFrom(e.target.value)}
                      style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd3",borderRadius:7,fontSize:13,fontFamily:"inherit",background:"#faf8f4",outline:"none",boxSizing:"border-box"}} />
                  </div>
                  <div style={{color:"#aaa",fontSize:16,paddingTop:18}}>～</div>
                  <div>
                    <div style={{fontSize:10,color:"#aaa",marginBottom:4}}>結束日期</div>
                    <input type="date" value={exportTo} onChange={e=>setExportTo(e.target.value)}
                      style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dbd3",borderRadius:7,fontSize:13,fontFamily:"inherit",background:"#faf8f4",outline:"none",boxSizing:"border-box"}} />
                  </div>
                </div>
                {/* 快速選擇 */}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                  {[
                    {label:"第1學期",from:"2026-08-01",to:"2027-01-31"},
                    {label:"第2學期",from:"2027-02-01",to:"2027-07-31"},
                    {label:"全學年",from:"2026-08-01",to:"2027-07-31"},
                    {label:"本月",from:`${year}-${String(month+1).padStart(2,"0")}-01`,to:`${year}-${String(month+1).padStart(2,"0")}-31`},
                    {label:"清除",from:"",to:""},
                  ].map(({label,from,to})=>(
                    <button key={label} onClick={()=>{setExportFrom(from);setExportTo(to);}}
                      style={{fontSize:11,padding:"4px 10px",borderRadius:8,border:"1px solid #e0dbd3",
                        background:"#f8f5f0",cursor:"pointer",color:"#555"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 類別篩選 */}
              <div>
                <div style={{fontSize:11,letterSpacing:2,color:"#aaa",textTransform:"uppercase",marginBottom:8}}>類別篩選</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  <button style={{fontSize:11,padding:"4px 10px",borderRadius:10,border:`1px solid ${exportCat==="全部"?"#555":"#e0dbd3"}`,background:exportCat==="全部"?"#555":"transparent",color:exportCat==="全部"?"#fff":"#888",cursor:"pointer"}} onClick={()=>setExportCat("全部")}>全部</button>
                  {Object.entries(COLORS).map(([cat,col])=>(
                    <button key={cat} style={{fontSize:11,padding:"4px 10px",borderRadius:10,border:`1px solid ${exportCat===cat?col:"#e0dbd3"}`,background:exportCat===cat?col:"transparent",color:exportCat===cat?"#fff":"#888",cursor:"pointer"}} onClick={()=>setExportCat(exportCat===cat?"全部":cat)}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* 即時預覽 */}
              <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,background:"#f0f6f2",border:"1px solid #b8d9c8"}}>
                <span style={{fontSize:12,color:"#3d6b4f",fontWeight:600}}>
                  📋 符合條件：{exportScope.length} 筆事件
                </span>
                <span style={{fontSize:11,color:"#888",marginLeft:8}}>
                  {rangeLabel()} · {exportCat}
                </span>
                {exportScope.length > 0 && (
                  <span style={{fontSize:11,color:"#aaa",marginLeft:8}}>
                    ({exportScope[0].date} ～ {exportScope[exportScope.length-1].date})
                  </span>
                )}
              </div>
            </div>

            {/* 匯出格式選擇 */}
            <div style={{background:"#fff",border:"1px solid #e5e0d8",borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>選擇匯出格式</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <ExportCard icon="📄" title="排版 HTML 文件" ext=".html"
                  desc="有月份標題、顏色分類、表格排版，可用瀏覽器列印或存成 PDF"
                  tags={["列印友善","可存 PDF","專業排版"]}
                  color="#2471a3" disabled={!exportScope.length} onClick={exportHTML} />

                <ExportCard icon="📥" title="系統相容 CSV" ext=".csv"
                  desc="欄位格式與系統一致，未來可重新匯入本行事曆系統"
                  tags={["可重新匯入","保留類別","保留顏色"]}
                  color="#3d6b4f" disabled={!exportScope.length} onClick={exportSystemCSV} />

                <ExportCard icon="📊" title="Excel CSV" ext=".csv"
                  desc="含星期欄位，可用 Excel / Google 試算表開啟分析"
                  tags={["Excel 開啟","含星期","統計分析"]}
                  color="#d35400" disabled={!exportScope.length} onClick={exportExcelCSV} />

                <ExportCard icon="📅" title="iCal 行事曆" ext=".ics"
                  desc="匯入 Google 行事曆、Apple 行事曆、Outlook 等應用程式"
                  tags={["Google 行事曆","Apple 行事曆","Outlook"]}
                  color="#7d3c98" disabled={!exportScope.length} onClick={exportICS} />

                <ExportCard icon="📦" title="JSON 備份" ext=".json"
                  desc="完整欄位備份，保留所有原始資料"
                  tags={["完整備份","結構化資料","開發用"]}
                  color="#148f77" disabled={!exportScope.length} onClick={exportJSON} />
              </div>
            </div>

            {/* 匯出結果訊息 */}
            {exportMsg && (
              <div style={{padding:"10px 14px",borderRadius:8,fontSize:12,marginBottom:14,
                background:exportMsg.startsWith("✅")?"#eef4ee":"#fef9ec",
                color:exportMsg.startsWith("✅")?"#2d6a3f":"#92610a"}}>
                {exportMsg}
              </div>
            )}

            {/* 格式對照表 */}
            <div style={{background:"#faf8f4",border:"1px solid #e5e0d8",borderRadius:10,padding:14}}>
              <div style={{fontSize:12,fontWeight:600,color:"#555",marginBottom:10}}>📋 格式用途對照</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{borderBottom:"1px solid #e5e0d8"}}>
                  {["格式","最適用途","可重新匯入本系統"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"6px 8px",color:"#aaa",fontWeight:500}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[
                    ["排版 HTML","列印紙本、存成 PDF、報告用途","❌（人類閱讀用）"],
                    ["系統相容 CSV","重新匯入本系統、資料備份","✅ 直接匯入"],
                    ["Excel CSV","統計分析、篩選排序、製作圖表","❌（欄位不同）"],
                    ["iCal","手機行事曆、提醒通知","❌（行事曆 App 用）"],
                    ["JSON","開發備份、程式處理","✅ 可解析匯入"],
                  ].map(([fmt,use,re])=>(
                    <tr key={fmt} style={{borderBottom:"1px solid #f0ede7"}}>
                      <td style={{padding:"7px 8px",fontWeight:600,color:"#555"}}>{fmt}</td>
                      <td style={{padding:"7px 8px",color:"#777"}}>{use}</td>
                      <td style={{padding:"7px 8px",color:re.startsWith("✅")?"#3d6b4f":"#aaa"}}>{re}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="manual" && (
          <div>
            <div style={S.formCard}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#2c2826"}}>新增行事曆事件</div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={S.formRow}>
                  <label style={S.fLabel}>日期 *</label>
                  <input type="date" style={S.fInput} value={form.date}
                    onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
                </div>
                <div style={S.formRow}>
                  <label style={S.fLabel}>時間（選填）</label>
                  <input type="time" style={S.fInput} value={form.time}
                    onChange={e=>setForm(f=>({...f,time:e.target.value}))} />
                </div>
              </div>

              <div style={S.formRow}>
                <label style={S.fLabel}>事件名稱 *</label>
                <input type="text" style={S.fInput} value={form.name}
                  placeholder="例：期中考、校外教學、宿舍報到..."
                  onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&submitForm()} />
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={S.formRow}>
                  <label style={S.fLabel}>分類</label>
                  <select style={S.fSelect} value={form.cat}
                    onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                    {CAT_LIST.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",paddingBottom:12}}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {Object.entries(COLORS).map(([cat,col])=>(
                      <div key={cat}
                        style={{width:18,height:18,borderRadius:4,background:col,cursor:"pointer",
                          border:form.cat===cat?"3px solid #2c2826":"3px solid transparent",
                          title:cat}}
                        title={cat}
                        onClick={()=>setForm(f=>({...f,cat}))} />
                    ))}
                  </div>
                </div>
              </div>

              <div style={S.formRow}>
                <label style={S.fLabel}>備註（選填）</label>
                <input type="text" style={S.fInput} value={form.note}
                  placeholder="例：至10月8日、第一章至第三章..."
                  onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
              </div>

              <button style={S.addBtn} onClick={submitForm}>＋ 新增事件</button>
              {formMsg && <div style={S.formMsg}>{formMsg}</div>}
            </div>

            {/* 已新增的事件列表 */}
            {events.length>0 && (
              <div style={{...S.formCard,marginBottom:0}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:"#555"}}>
                  已新增事件（共 {events.length} 筆）
                </div>
                <div style={{maxHeight:300,overflowY:"auto"}}>
                  {[...events].reverse().map(ev=>(
                    <div key={ev.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #f0ede7"}}>
                      <div style={{width:10,height:10,borderRadius:2,background:ev.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,fontWeight:500}}>{ev.name}</span>
                        <span style={{fontSize:11,color:"#aaa",marginLeft:8,fontFamily:"monospace"}}>{ev.date} {ev.time||""}</span>
                      </div>
                      <span style={{fontSize:10,color:ev.color,background:ev.color+"15",padding:"2px 6px",borderRadius:10}}>{ev.cat}</span>
                      <button style={S.delBtn} onClick={()=>deleteEvent(ev.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 行事曆頁（以及 PDF/手動頁也顯示行事曆） ── */}
        {(tab==="cal"||tab==="pdf"||tab==="manual") && tab==="cal" && (
          <div style={{marginTop: tab==="cal"?0:20}}>
            <CalendarView
              year={year} month={month} cells={cells}
              monthEvents={monthEvents} today={today}
              selected={selected} setSelected={setSelected}
              selEvents={selEvents} getEvents={getEvents}
              deleteEvent={deleteEvent} S={S}
            />
          </div>
        )}

        {/* PDF/手動頁下方也顯示月曆 */}
        {tab!=="cal" && (
          <div style={{marginTop:16}}>
            <CalendarView
              year={year} month={month} cells={cells}
              monthEvents={monthEvents} today={today}
              selected={selected} setSelected={setSelected}
              selEvents={selEvents} getEvents={getEvents}
              deleteEvent={deleteEvent} S={S}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── 月曆元件 ──
function CalendarView({year,month,cells,monthEvents,today,selected,setSelected,selEvents,getEvents,deleteEvent,S}) {
  return (
    <>
      <div style={S.calHdr}>
        <h2 style={{fontSize:17,fontWeight:700}}>
          {year} 年 {month+1} 月
          <span style={{fontSize:11,color:"#aaa",fontWeight:400,marginLeft:8}}>（{monthEvents.length} 個事件）</span>
        </h2>
      </div>
      <div style={S.grid}>
        <div style={S.wdRow}>
          {["日","一","二","三","四","五","六"].map((d,i)=>(
            <div key={d} style={{textAlign:"center",padding:"7px 0",fontSize:10,letterSpacing:2,color:i===0?"#c0392b":i===6?"#2471a3":"#aaa",fontFamily:"monospace"}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {cells.map((cell,idx)=>{
            const evs=getEvents(cell.date);
            return (
              <div key={idx}
                style={{...S.cell(cell.date===selected,cell.date===today,cell.cur),borderRight:(idx+1)%7===0?"none":"1px solid #e5e0d8"}}
                onClick={()=>setSelected(cell.date)}>
                <div style={S.dNum(cell.date===today,cell.dow)}>{cell.day}</div>
                {evs.slice(0,3).map(ev=>(
                  <div key={ev.id} style={S.pill(ev.color)} title={ev.name}>{ev.name}</div>
                ))}
                {evs.length>3&&<div style={{fontSize:8,color:"#aaa"}}>+{evs.length-3}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {selected && (
        <div style={S.detail}>
          <div style={{fontSize:12,color:"#aaa",marginBottom:10,fontFamily:"monospace"}}>
            📅 {selected}（{["日","一","二","三","四","五","六"][new Date(selected).getDay()]}）
          </div>
          {selEvents.length===0
            ? <div style={{fontSize:13,color:"#aaa"}}>這天沒有行事曆事件。點左方「手動輸入」可新增。</div>
            : selEvents.map(ev=>(
              <div key={ev.id} style={S.detEv(ev.color)}>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{ev.name}</div>
                  <div style={{fontSize:11,color:"#aaa",marginTop:2,fontFamily:"monospace"}}>
                    {ev.cat}{ev.time?" ｜ "+ev.time:""}{ev.note&&ev.note!==ev.name?" ｜ "+ev.note.slice(0,40):""}
                  </div>
                </div>
                <button style={S.delBtn} onClick={()=>deleteEvent(ev.id)} title="刪除此事件">✕</button>
              </div>
            ))
          }
        </div>
      )}
    </>
  );
}

// ── 匯出格式卡片元件 ──
function ExportCard({icon, title, ext, desc, tags, color, disabled, onClick}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        padding:"14px", borderRadius:10, textAlign:"left", cursor:disabled?"not-allowed":"pointer",
        border:`1px solid ${hover&&!disabled?color:"#e5e0d8"}`,
        background: hover&&!disabled ? color+"0f" : disabled?"#f8f8f8":"#fff",
        transition:"all .15s", opacity:disabled?0.5:1,
      }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <span style={{fontSize:22}}>{icon}</span>
        <span style={{fontSize:10,fontFamily:"monospace",color:color,background:color+"18",
          padding:"2px 7px",borderRadius:6,fontWeight:600}}>{ext}</span>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#2c2826",marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:"#888",marginBottom:8,lineHeight:1.5}}>{desc}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {tags.map(t=>(
          <span key={t} style={{fontSize:9,padding:"2px 6px",borderRadius:8,
            background:color+"15",color:color,border:`1px solid ${color}40`}}>{t}</span>
        ))}
      </div>
    </button>
  );
}
