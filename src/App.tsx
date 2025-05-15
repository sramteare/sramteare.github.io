import './App.css';
import {Calendar} from './components/calendar/calendar';
import {CardShuffle} from './components/card-shuffle/card-shuffle'

function App() {
  return (
    <div className="App">
      <h2>Examples</h2>
      <div className='examples'>
      <section>
        <h3>Learn to code</h3>
        <hr aria-hidden="true"/>
        <p>A tool to learn coding on web</p>
        <a href="https://github.com/sramteare/learn-coding" target="_blank" rel="noreferrer">Checkout Code</a>
      </section>
      <section>
        <h3>React - Simple calendar</h3>
        <hr aria-hidden="true"/>
        <p>Using React functional component for developing calendar widget. A simple calendar shows today&apos;s date and calendar view of the dates month. Right and left arrow buttons take user to previous or future dates.</p>
        <Calendar />
      </section>
      <section>
        <h3>React - Shuffle Cards</h3>
        <hr aria-hidden="true"/>
        <p>This component renders a Card deck and a draw plane. The shuffle function uses Fisher-Yates shuffle algorithm shuffle the deck. And when user clicks on the top card in the deck, 4 cards are drawn from the deck and displayed in the draw plane.</p>
        <CardShuffle />
      </section>
      </div>
    </div>
  );
}

export default App;
