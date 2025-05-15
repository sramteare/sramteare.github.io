import { Link } from 'react-router-dom';
import { Calendar } from '../components/calendar/calendar';
import { CardShuffle } from '../components/card-shuffle/card-shuffle';

const HomePage: React.FC = () => {
  return (
    <>
    <header className="main-header">
      <section className="hero-section">
        <picture>
          <source srcSet="/img/sb_ps_780.webp"
            media="(max-width: 639px)" />
          <source srcSet="/img/sp_ps_1920.webp"
                  media="(min-width: 640px) and (max-width: 1023px)" />
          <source srcSet="/img/sb_ps_2048.webp"
                  media="(min-width: 1024px)" />
          <img className='hero-picture' src="/img/sb_ps_full.webp" alt="Yellow! lol!"/>
        </picture>
      </section>
      <section className="header-content">
        <h1 className="condensed-text">Who lives in the Pineapple under the Sea?</h1>
        <div className="title">
          <h2>SATISH RAMTEAERE</h2>
          <p className="condensed-text">Software Engineer</p>
          <ul>
            <li><a className="icon-before linkedin" href="https://www.linkedin.com/in/satish-ramteare/" title="Linked" aria-label="to linkedin"></a></li>
            <li><a className="icon-before github" href="https://github.com/sramteare?tab=repositories" title="Github" aria-label="to github"></a></li>
          </ul>
        </div>
      </section>
    </header>
    <div className='main-content'>
      <section className="page-content">
        <h2>HCI Developer for Web and Beyond</h2>
        <p>I build software that's easy and effective for people to use, applying Human-Computer Interaction principles to every solution.</p>
        <p>My work involves making data easy to understand through visualization and using smart algorithms to create smooth, fast ways for people to interact with complex technology.</p>
      </section>
      <section className="page-content">
        <h2>Leadership</h2>
        <p>I enjoy leading teams to build great software. This means working closely with product managers and architects, guiding agile development, and ensuring our code is top-notch through careful reviews. I'm also passionate about helping others grow by sharing knowledge of core programming concepts, setting clear architectural standards, and always looking for ways to make our development work smoother and more effective.</p>  
      </section>
      <section className="page-content">
        <h2>Frontend/Full-stack Expertise</h2>
        <p>Deep expertise in developing and maintaining scalable component-based UI frameworks, leveraging strong software design patterns. Skilled in architecting and implementing resilient REST APIs and API Gateways within distributed microservice systems, with a core focus on optimizing Web UI and application performance through fundamental algorithm and data structure knowledge.</p>
      </section>
      <section className="page-content">
        <h2>Bookmarks</h2>
        <p>Some links I find interesting and you might too!</p>
        <ul>
            <li><a href="https://mathiasbynens.be/notes/shapes-ics">JavaScript engine fundamentals: Shapes and Inline Caches</a></li>
            <li><a href="https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/">JavaScript Tasks, microtasks, queues and schedules</a></li>
        </ul>
      </section>
      <section className="page-content">
        <ul className="bubbles">
            <li>AI</li>
            <li>LLM</li>
            <li>JavaScript</li>
            <li>TypeScript</li>
            <li>ES6</li>
            <li>Problem Solving</li>
            <li>Data structures</li>
            <li>Algorithms</li>
            <li>CSS</li>
            <li>HTML</li>
            <li>SPA</li> 
            <li>NodeJs</li>
            <li>REST API design</li>
            <li>CI/CD</li>
            <li>Git</li>
            <li>Gradle</li>
            <li>Unit Testing and Integration testing</li>
            <li>Jest</li>
            <li>React</li>
            <li>Redux</li>
            <li>OAuth</li>
            <li>JWT</li>
            <li>SOLR</li>
            <li>Frontend performance/System performance</li>
            <li>Distributed systems/microservice</li>
            <li>Docker</li>
            <li>AWS</li>
        </ul>
      </section>
      <section className="page-content">
        <h2>Examples</h2> {/* Moved heading here */}
        <div className='examples'>
            <section>
            <h3>Learn to code</h3>
            <hr aria-hidden="true"/>
            <p>A tool to learn coding on web</p>
            <a href="https://github.com/sramteare/learn-coding" target="_blank" rel="noreferrer">Checkout Code</a>
            <br />
            <Link to="/learn-coding">Go to Learn Coding Page</Link>
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
      </section>
      </div>
    </>
  );
};

export default HomePage;