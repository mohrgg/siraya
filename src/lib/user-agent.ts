/**
 * Zero-dependency User-Agent Parser & Device Inspector
 * Mengekstrak informasi Browser, Versi, Sistem Operasi (OS), dan Tipe Perangkat
 * secara cepat dan aman untuk Edge & Node.js runtime tanpa library eksternal.
 */

export interface ParsedUserAgent {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "BOT" | "UNKNOWN"
  summary: string // e.g. "Chrome 128 • macOS"
  isMobile: boolean
}

export function parseUserAgent(uaString?: string | null): ParsedUserAgent {
  if (!uaString || typeof uaString !== "string" || uaString.trim() === "") {
    return {
      browser: "Tidak Diketahui",
      browserVersion: "",
      os: "Tidak Diketahui",
      osVersion: "",
      deviceType: "UNKNOWN",
      summary: "Browser Tidak Terdeteksi",
      isMobile: false
    }
  }

  const ua = uaString.trim()

  // 1. Deteksi Bot / Crawler
  if (/bot|crawler|spider|crawling|curl|wget|postman/i.test(ua)) {
    return {
      browser: "Bot / Crawler",
      browserVersion: "",
      os: "Automated",
      osVersion: "",
      deviceType: "BOT",
      summary: "Bot / API Client",
      isMobile: false
    }
  }

  // 2. Deteksi Device Type
  let deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "BOT" | "UNKNOWN" = "DESKTOP"
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook)/i.test(ua)
  const isMobilePhone = /(mobi|ipod|phone|blackberry|opera mini|fennec|minimo)/i.test(ua)

  if (isTablet) {
    deviceType = "TABLET"
  } else if (isMobilePhone) {
    deviceType = "MOBILE"
  }

  // 3. Deteksi Sistem Operasi (OS)
  let os = "Lainnya"
  let osVersion = ""

  if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS"
    const match = ua.match(/OS ([\d_]+)/)
    if (match?.[1]) osVersion = match[1].replace(/_/g, ".")
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS"
    const match = ua.match(/Mac OS X ([\d_]+)/)
    if (match?.[1]) osVersion = match[1].replace(/_/g, ".")
  } else if (/android/i.test(ua)) {
    os = "Android"
    const match = ua.match(/Android ([\d.]+)/)
    if (match?.[1]) osVersion = match[1]
  } else if (/windows nt/i.test(ua)) {
    os = "Windows"
    if (/Windows NT 10.0/i.test(ua)) osVersion = "10/11"
    else if (/Windows NT 6.3/i.test(ua)) osVersion = "8.1"
    else if (/Windows NT 6.1/i.test(ua)) osVersion = "7"
  } else if (/linux/i.test(ua)) {
    os = "Linux"
  } else if (/cros/i.test(ua)) {
    os = "ChromeOS"
  }

  // 4. Deteksi Browser & Versi
  let browser = "Browser Lain"
  let browserVersion = ""

  if (/edg\//i.test(ua)) {
    browser = "Microsoft Edge"
    const match = ua.match(/edg\/([\d.]+)/i)
    if (match?.[1]) browserVersion = match[1].split(".")[0]
  } else if (/opr\/|opera/i.test(ua)) {
    browser = "Opera"
    const match = ua.match(/(opr|opera)\/([\d.]+)/i)
    if (match?.[2]) browserVersion = match[2].split(".")[0]
  } else if (/samsungbrowser/i.test(ua)) {
    browser = "Samsung Internet"
    const match = ua.match(/samsungbrowser\/([\d.]+)/i)
    if (match?.[1]) browserVersion = match[1].split(".")[0]
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Google Chrome"
    const match = ua.match(/(chrome|crios)\/([\d.]+)/i)
    if (match?.[2]) browserVersion = match[2].split(".")[0]
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Mozilla Firefox"
    const match = ua.match(/(firefox|fxios)\/([\d.]+)/i)
    if (match?.[2]) browserVersion = match[2].split(".")[0]
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = "Safari"
    const match = ua.match(/version\/([\d.]+)/i)
    if (match?.[1]) browserVersion = match[1].split(".")[0]
  }

  const browserDisplay = browserVersion ? `${browser} ${browserVersion}` : browser
  const osDisplay = osVersion ? `${os} ${osVersion}` : os
  const summary = `${browserDisplay} • ${osDisplay}`

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    summary,
    isMobile: deviceType === "MOBILE" || deviceType === "TABLET"
  }
}
