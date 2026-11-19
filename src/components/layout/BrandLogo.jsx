import { Link } from '../../router.jsx'

export default function BrandLogo({ to = '/', ariaLabel = 'Beranda Lost and Found UNKLAB' }) {
  return (
    <Link to={to} className="sq-brand" aria-label={ariaLabel}>
      <span className="sq-brand-box" aria-hidden="true">
        <img src="/figma/logo-cube.svg" alt="" width="56" height="56" />
      </span>
      <span className="sq-brand-text" aria-hidden="true">
        <span className="sq-brand-line-top">
          <span className="sq-brand-word-lost">Lost</span>
          <span className="sq-brand-word-and">and</span>
        </span>
        <span className="sq-brand-line-mid">
          <span>F</span>
          <svg
            className="sq-brand-pin-o"
            viewBox="0 0 24 28"
            width="18"
            height="21"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 26.5C8.2 21.3 2.5 15.8 2.5 10.2C2.5 5.1 6.7 1 12 1C17.3 1 21.5 5.1 21.5 10.2C21.5 15.8 15.8 21.3 12 26.5Z"
              fill="#9EFF00"
              stroke="#1A1A1A"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10.2" r="4.2" fill="#1A1A1A" />
          </svg>
          <span>und</span>
        </span>
        <small className="sq-brand-unklab-pill">UNKLAB</small>
      </span>
    </Link>
  )
}
