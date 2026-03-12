import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export timeline calendar as PNG image
 */
export async function exportTimelineAsPNG() {
  const timelineElement = document.querySelector('.timeline-calendar')
  
  if (!timelineElement) {
    alert('No timeline to export. Please calculate a project first.')
    return
  }

  try {
    // Temporarily expand timeline if collapsed
    const wasCollapsed = !timelineElement.querySelector('.timeline-grid')
    if (wasCollapsed) {
      const toggleBtn = timelineElement.querySelector('.timeline-toggle')
      toggleBtn?.click()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Capture the element
    const canvas = await html2canvas(timelineElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      windowWidth: 1200,
      windowHeight: timelineElement.scrollHeight
    })

    // Convert to PNG and download
    const link = document.createElement('a')
    link.download = `project-timeline-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    // Collapse back if it was collapsed
    if (wasCollapsed) {
      const toggleBtn = timelineElement.querySelector('.timeline-toggle')
      toggleBtn?.click()
    }

    return true
  } catch (error) {
    console.error('Error exporting PNG:', error)
    alert('Failed to export image. Please try again.')
    return false
  }
}

/**
 * Export timeline calendar as PDF
 */
export async function exportTimelineAsPDF() {
  const timelineElement = document.querySelector('.timeline-calendar')
  
  if (!timelineElement) {
    alert('No timeline to export. Please calculate a project first.')
    return
  }

  try {
    // Temporarily expand timeline if collapsed
    const wasCollapsed = !timelineElement.querySelector('.timeline-grid')
    if (wasCollapsed) {
      const toggleBtn = timelineElement.querySelector('.timeline-toggle')
      toggleBtn?.click()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Capture the element
    const canvas = await html2canvas(timelineElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      windowWidth: 1200,
      windowHeight: timelineElement.scrollHeight
    })

    // Calculate PDF dimensions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    let heightLeft = imgHeight
    let position = 0

    // Add image to PDF (handle multiple pages if needed)
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    )
    heightLeft -= pageHeight

    // Add extra pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      )
      heightLeft -= pageHeight
    }

    // Download PDF
    pdf.save(`project-timeline-${new Date().toISOString().split('T')[0]}.pdf`)

    // Collapse back if it was collapsed
    if (wasCollapsed) {
      const toggleBtn = timelineElement.querySelector('.timeline-toggle')
      toggleBtn?.click()
    }

    return true
  } catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Failed to export PDF. Please try again.')
    return false
  }
}