import React from 'react';
import './App.css';
import {Calendar} from './components/calendar/calendar';
import {CardShuffle} from './components/card-shuffle/card-shuffle'

function App() {
  return (
    <div className="App">
      <h2>Examples</h2>
      <section><h3>React - Simple calendar</h3>
        <p>Using React functional component for developing calendar widget. A simple calendar shows today's date and calendar view of the dates month. Right and left arrow buttons take user to previous or future dates.</p>
        <hr aria-hidden="true"/>
        <Calendar />
      </section>
      <section><h3>React - Shuffle Cards</h3>
        <p>This component renders a Card deck and a draw plane. The shuffle function uses Fisher–Yates shuffle algorithm shuffle the deck. And when user clicks on the top card in the deck, 4 cards are drawn from the deck and displayed in the draw plane.</p>
        <hr aria-hidden="true"/>
        <CardShuffle />
      </section>
    </div>
  );
}

export default App;
