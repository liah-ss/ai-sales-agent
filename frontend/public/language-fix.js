(() => {
  const localeByLabel = { EN: 'en', ID: 'id', '\u4e2d\u6587': 'zh-cn' }
  const localePrefix = /^\/(?:id|en|zh-cn)(?=\/|$)/

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const button = target.closest('button.language-pill')
    if (!button) return
    const label = (button.textContent || '').trim()
    const nextLocale = localeByLabel[label]
    if (!nextLocale) return
    event.preventDefault()
    event.stopImmediatePropagation()
    const currentPath = window.location.pathname || '/'
    const path = currentPath.replace(localePrefix, '') || '/'
    const query = window.location.search || ''
    const hash = window.location.hash || ''
    window.location.assign(`/${nextLocale}${path === '/' ? '/' : path}${query}${hash}`)
  }, true)

})()
