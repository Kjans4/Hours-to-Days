import { useState } from 'react'
import { exportTimelineAsPNG, exportTimelineAsPDF } from '../utils/exportTimeline'

function ExportButtons() {
  const [exporting, setExporting] = useState(false)

  const handleExportPNG = async () => {
    setExporting(true)
    await exportTimelineAsPNG()
    setExporting(false)
  }

  const handleExportPDF = async () => {
    setExporting(true)
    await exportTimelineAsPDF()
    setExporting(false)
  }

  return (
    <div className="export-buttons">
      <button
        onClick={handleExportPNG}
        disabled={exporting}
        className="export-btn export-png"
        title="Download timeline as PNG image"
      >
        {exporting ? (
          <>⏳ Exporting...</>
        ) : (
          <>📥 Download PNG</>
        )}
      </button>
      <button
        onClick={handleExportPDF}
        disabled={exporting}
        className="export-btn export-pdf"
        title="Download timeline as PDF document"
      >
        {exporting ? (
          <>⏳ Exporting...</>
        ) : (
          <>📄 Export PDF</>
        )}
      </button>
    </div>
  )
}

export default ExportButtons