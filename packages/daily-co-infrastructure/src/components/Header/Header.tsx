import "./Header.css";

export default function Header() {
  return (
    <header>
      <div className="header-section">
        <span className="title">
          Custom video application demo with Daily React
        </span>
      </div>
      <div className="header-section">
        <a
          className="new-tab-link"
          href="https://docs.daily.co/reference/daily-js"
          target="_blank"
          rel="noreferrer"
        >
          <span>API docs</span>
        </a>
        <a
          className="github-link"
          href="https://github.com/daily-demos/custom-video-daily-react-hooks"
          target="_blank"
          rel="noreferrer"
        ></a>
      </div>
    </header>
  );
}
