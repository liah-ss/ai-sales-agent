const BAIDU_ANALYTICS_ID = '1fe5a4264130c1259ba1ed81cfbad7ef'
const BAIDU_SCRIPT_URL = 'https://hm.baidu.com/hm.js?1fe5a4264130c1259ba1ed81cfbad7ef'

function loadBaiduAnalytics() {
  if (document.querySelector(`script[src*="hm.baidu.com/hm.js?${BAIDU_ANALYTICS_ID}"]`)) return
  const script = document.createElement('script')
  script.async = true
  script.src = BAIDU_SCRIPT_URL
  document.body.append(script)
}

export default defineNuxtPlugin(() => {
  window.setTimeout(loadBaiduAnalytics, 1_000)
})
