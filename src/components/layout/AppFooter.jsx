export default function AppFooter({ user }) {
  return (
    <footer className="sq-footer">
      <div className="sq-footer-inner">
        <div className="sq-footer-bottom">
          <div className="sq-footer-contacts">
            <div className="sq-contact-pill">
              <img src="/figma/icon-mail.svg" alt="" width="22" height="22" />
              <span>{user.email}</span>
            </div>
            <div className="sq-contact-pill">
              <img src="/figma/icon-location.svg" alt="" width="22" height="22" />
              <span>Portal Mahasiswa Universitas Klabat</span>
            </div>
          </div>
          <p className="sq-copyright">© 2026 Lost and Found UNKLAB · Menemukan jalan pulang.</p>
        </div>
      </div>
    </footer>
  )
}
