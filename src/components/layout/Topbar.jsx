import Icon from '../icons/Icon.jsx'

export default function Topbar({ onMenu }) {
  return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Buka menu"><Icon name="menu" /></button><div className="breadcrumb"><span>Beranda</span><b>/</b><strong>Ringkasan</strong></div><div className="topbar-actions"><button className="icon-button notification" aria-label="Notifikasi"><Icon name="bell" size={19} /><i /></button><div className="topbar-profile"><div className="avatar avatar-small">YA</div><span>Yoel Antariksa</span><Icon name="chevron" size={16} /></div></div></header>
}
