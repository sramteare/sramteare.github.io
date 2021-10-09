import React, { useEffect, useState } from "react"
const WEEK_DAYS = ["Sun","Mon","Tue","Wed","Thus","Fri","Sat"];
const TODAY_PROPS = {className: "today", 'aria-label':"Today"}
export const Calendar = () => {
    /** state */
    const [today, setToday] = useState(new Date());
    const [todayDate, setTodayDate] = useState(new Date().getDate());
    useEffect(()=>setToday(new Date()), [])
    useEffect(()=>setTodayDate(today.getDate()), [today])
    /** actions */
    const goBack =()=>{
        setToday(new Date(today.getFullYear(), today.getMonth(), today.getDate()-1))
    }
    const goForward = ()=>setToday(new Date(today.getFullYear(), today.getMonth(), today.getDate()+1))
    const getKey = (idx:number) => `${today.getFullYear()}-${today.getMonth()}-${idx}`;

    /** view data */
    const lastDateLastMonth = new Date(today.getFullYear(), today.getMonth(),0);
    const lastDate = new Date(today.getFullYear(), today.getMonth()+1,0);
    let pad = lastDateLastMonth.getDay();
    let date = lastDateLastMonth.getDate();
    const calendarMonth: Array<JSX.Element> = [];
    // numdays used as keys
    let numDays = 0;

    // previous calendar dates
    let rows = Array.from({
        length:pad+1
    }, (_,i)=>{
        const val = date-pad;
        pad--;
        return <td  key={getKey(numDays++)} className="non-current">{val}</td>;
    });
    
    pad = lastDateLastMonth.getDay();
    const last = lastDate.getDate();
    let i = 0;
    while(i < last){
        if(rows.length % 7 === 0) {
            calendarMonth.push(<tr key={getKey(calendarMonth.length+40)}>{rows}</tr>)
            rows=[];
        }
        rows.push(<td key={getKey(numDays++)} {...(todayDate === i+1 ? TODAY_PROPS : {})}>{++i}</td>)
    }
    let count = 1;
    // remaining days, from next month
    
    while(rows.length % 7 !== 0) {
        rows.push(<td key={getKey(numDays++)} className="non-current">{count}</td>);
        ++count;
    }
    calendarMonth.push(<tr key={getKey(calendarMonth.length+40)}>{rows}</tr>)
    
    return (<div className="card calendar">
        <header className="calendar-header">
            <button className="clear" onClick={goBack}>&lt;</button>
            <span>{today.toLocaleString('default', { year: 'numeric', month: 'short', day:"numeric" })}</span>
            <button className="clear" onClick={goForward}>&gt;</button>
        </header>
        <table className="calendar-table">
            <thead><tr>{WEEK_DAYS.map( (day)=><th key={day}>{day}</th>)}</tr></thead>
            <tbody>{
               calendarMonth
            }</tbody>
        </table>
        </div>);
}