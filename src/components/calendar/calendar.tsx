import { JSX, useEffect, useState } from "react"
import './css/calendar.css'

const WEEK_DAYS = ["Sun","Mon","Tue","Wed","Thus","Fri","Sat"];
const TODAY_PROPS = {className: "today", 'aria-label':"Today"}
export const Calendar = () => {
    /** state */
    const [today, setToday] = useState(new Date());
    const [todayDate, setTodayDate] = useState(new Date().getDate());
    useEffect(()=>setToday(new Date()), [])
    useEffect(()=>setTodayDate(today.getDate()), [today])
    /** actions */
    const goBackDay =()=>{
        setToday(new Date(today.getFullYear(), today.getMonth(), today.getDate()-1))
    }
    const goForwardDay = ()=>setToday(new Date(today.getFullYear(), today.getMonth(), today.getDate()+1))

    const goBackMonth =()=>{
        setToday(new Date(today.getFullYear(), today.getMonth() -1, today.getDate()))
    }
    const goForwardMonth = ()=>setToday(new Date(today.getFullYear(), today.getMonth()+1, today.getDate()))

    const getKey = (idx:number) => `${today.getFullYear()}-${today.getMonth()}-${idx}`;

    /** view data */
    const lastDateLastMonth = new Date(today.getFullYear(), today.getMonth(),0);
    const lastDate = new Date(today.getFullYear(), today.getMonth()+1,0);
    let pad = lastDateLastMonth.getDay();
    const date = lastDateLastMonth.getDate();
    const calendarMonth: Array<JSX.Element> = [];
    // numdays used as keys
    let numDays = 0;

    // previous calendar dates
    let rows = Array.from({
        length:pad+1
    }, ()=>{
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
            <button aria-label="navigate to previous month view" className="clear" onClick={goBackMonth}>&lt;&lt;</button>
                <button aria-label="select previous day" className="clear" onClick={goBackDay}>&lt;</button>
                    <span className="selected-date">{today.toLocaleString('default', { year: 'numeric', month: 'short', day:"numeric" })}</span>
                <button aria-label="select next day" className="clear" onClick={goForwardDay}>&gt;</button>
            <button aria-label="navigate to next month view" className="clear" onClick={goForwardMonth}>&gt;&gt;</button>
        </header>
        <table className="calendar-table">
            <thead><tr>{WEEK_DAYS.map( (day)=><th key={day}>{day}</th>)}</tr></thead>
            <tbody>{
               calendarMonth
            }</tbody>
        </table>
        </div>);
}