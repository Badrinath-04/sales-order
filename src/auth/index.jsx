import { Link } from 'react-router-dom'
import './styles.scss'

export default function Login() {
  return (
    <div className="login">
      <h2 className="login__heading">Sign in</h2>
      <p className="login__sub">Use your campus credentials (UI only).</p>
      <form className="login__form" onSubmit={(e) => e.preventDefault()}>
        <label className="login__field">
          <span className="login__label">Email</span>
          <input
            className="login__input"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="you@school.edu"
          />
        </label>
        <label className="login__field">
          <span className="login__label">Password</span>
          <input
            className="login__input"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="login__submit">
          Continue
        </button>
      </form>
      <p className="login__footer">
        <Link className="login__link" to="/">
          Skip to dashboard (demo)
        </Link>
      </p>
    </div>
  )
}
