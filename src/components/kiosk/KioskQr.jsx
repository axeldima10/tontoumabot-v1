import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

// QR code dessiné en SVG (un seul chemin) : net à toutes les tailles, sans image à charger.
function KioskQr({ value, label }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(value)
    qr.make()
    const count = qr.getModuleCount()
    let d = ''
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`
      }
    }
    return { size: count, path: d }
  }, [value])

  // Marge blanche de 2 modules : indispensable pour que les téléphones lisent le code.
  return (
    <svg className="kiosk-qr" viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#04140b" />
    </svg>
  )
}

export default KioskQr
