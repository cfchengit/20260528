import { useState } from 'react'
import TKUCalendar    from './tku-calendar'
import PDFCalendar    from './pdf-calendar-import'

export default function App() {
  const [page, setPage] = useState('tku')

  return (
    <>
      <div style={{ display:'flex', gap:8, padding:8, background:'#eee' }}>
        <button onClick={() => setPage('tku')}>115學年度行事曆</button>
        <button onClick={() => setPage('pdf')}>PDF 匯入行事曆</button>
      </div>
      {page === 'tku' && <TKUCalendar />}
      {page === 'pdf' && <PDFCalendar />}
    </>
  )
}