// แสดงระหว่างเซิร์ฟเวอร์ดึงข้อมูลหน้าใดๆ (สไตล์ skeleton จาก V14.9)
export default function Loading(){
  return (<div style={{ maxWidth:980, margin:'0 auto', padding:'48px 20px' }} aria-busy="true" aria-label="กำลังโหลด">
    <div className="sk" style={{ width:160, height:14, marginBottom:16 }}/><div className="sk" style={{ width:'min(360px,70%)', height:36, marginBottom:28 }}/>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>{[0, 1, 2, 3].map(i => <div key={i} className="sk" style={{ height:110, borderRadius:18 }}/>)}</div></div>);
}
