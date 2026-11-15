export function navigate(to) { window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')) }
export function Link({ to, onClick, ...props }) { return <a href={to} {...props} onClick={e => { e.preventDefault(); onClick?.(e); navigate(to) }} /> }
