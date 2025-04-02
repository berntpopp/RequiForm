<template>
  <div>
    <v-btn @click="generatePdf" color="primary" dark>
      Generate PDF
    </v-btn>
    <!-- Hidden container for the QR code -->
    <div ref="qrContainer" class="hidden">
      <qrcode-vue :value="qrContent" :size="128" />
    </div>
  </div>
</template>

<script setup>
import { jsPDF } from 'jspdf'
import { defineProps, ref, nextTick, computed, defineExpose } from 'vue'
import QrcodeVue from 'qrcode.vue'
import pdfConfig from '../data/pdfConfig.json'
import testsData from '../data/tests.json'

// Define props with an optional pedigree image URL.
const props = defineProps({
  patientData: { type: Object, required: true },
  selectedTests: { type: Array, required: true },
  pedigreeDataUrl: { type: String, required: false, default: '' }
})

// Expose generatePdf function for external use.
defineExpose({ generatePdf })

// Reference for the hidden QR code container.
const qrContainer = ref(null)

/**
 * Computes the grouped test panels by category based on the selected tests.
 *
 * @returns {Array<Object>} An array of objects each containing a category title and tests.
 */
const groupedPanels = computed(() =>
  testsData.categories
    .map(category => ({
      categoryTitle: category.title,
      tests: category.tests.filter(test => props.selectedTests.includes(test.id))
    }))
    .filter(group => group.tests.length > 0)
)

/**
 * Computes the content string for the QR code.
 *
 * @returns {string} The QR code content.
 */
const qrContent = computed(() =>
  `Given Name: ${props.patientData.givenName}, Family Name: ${props.patientData.familyName}, Birthdate: ${props.patientData.birthdate}, Insurance: ${props.patientData.insurance}, Tests: ${props.selectedTests.join(', ')}`
)

/**
 * Replaces all placeholders in the given template with corresponding values from the mapping.
 *
 * @param {string} template - The template string containing placeholders in the format {{ key }}.
 * @param {Object} mapping - An object mapping keys to their replacement values.
 * @returns {string} The resulting string with placeholders replaced.
 */
function mapTemplateString(template, mapping) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (match, key) =>
    key in mapping ? mapping[key] : ''
  )
}

/**
 * Renders a text element on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The configuration object for the text element.
 * @param {Object} mapping - The placeholder-to-value mapping for dynamic content.
 */
function renderText(doc, element, mapping) {
  const text = mapTemplateString(element.content, mapping)
  if (element.style) {
    doc.setFont(element.style.font || 'Helvetica', element.style.fontStyle || 'normal')
    doc.setFontSize(element.style.fontSize || 12)
    doc.setTextColor(element.style.color || '#000000')
  }
  doc.text(text, element.position.x, element.position.y)
}

/**
 * Renders an image element on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The configuration object for the image element.
 * @param {Object} mapping - The placeholder-to-value mapping for dynamic content.
 */
function renderImage(doc, element, mapping) {
  const imageData = mapTemplateString(element.source, mapping)
  doc.addImage(
    imageData,
    'PNG',
    element.position.x,
    element.position.y,
    element.size.width,
    element.size.height
  )
}

/**
 * Renders a rectangle element on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The configuration object for the rectangle element.
 */
function renderRectangle(doc, element) {
  const { x, y } = element.position
  const { width, height } = element.size
  const style = element.style || {}
  if (style.fill && style.fillColor) {
    doc.setFillColor(style.fillColor)
  }
  if (style.borderColor) {
    doc.setDrawColor(style.borderColor)
  }
  doc.setLineWidth(style.borderWidth || 1)
  let rectStyle = 'S'
  if (style.fill && style.fillColor) {
    rectStyle = style.borderWidth ? 'DF' : 'F'
  }
  doc.rect(x, y, width, height, rectStyle)
}

/**
 * Renders a line element on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} element - The configuration object for the line element.
 */
function renderLine(doc, element) {
  const { x: startX, y: startY } = element.start
  const { x: endX, y: endY } = element.end
  const style = element.style || {}
  doc.setLineWidth(style.lineWidth || 1)
  if (style.color) {
    doc.setDrawColor(style.color)
  }
  doc.line(startX, startY, endX, endY)
}

/**
 * Renders a section (a group of elements) on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} section - The section configuration object containing an array of elements.
 * @param {Object} mapping - The placeholder-to-value mapping for dynamic content.
 */
function renderSection(doc, section, mapping) {
  if (!section || !section.elements) return
  section.elements.forEach(element => {
    switch (element.type) {
      case 'text':
        renderText(doc, element, mapping)
        break
      case 'image':
        renderImage(doc, element, mapping)
        break
      case 'rectangle':
        renderRectangle(doc, element)
        break
      case 'line':
        renderLine(doc, element)
        break
      default:
        console.warn('Unknown element type:', element.type)
    }
  })
}

/**
 * Renders a category header on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {string} categoryTitle - The title text for the category.
 * @param {number} offsetX - The x-coordinate for the header.
 * @param {number} y - The y-coordinate for the header.
 * @param {number} spacing - The vertical spacing to add after the header.
 * @returns {number} The updated y-coordinate after rendering the header.
 */
function renderCategoryHeader(doc, categoryTitle, offsetX, y, spacing) {
  const headerStyle = {
    font: 'Helvetica',
    fontStyle: 'bold',
    fontSize: 12,
    color: '#000000'
  }
  doc.setFont(headerStyle.font, headerStyle.fontStyle)
  doc.setFontSize(headerStyle.fontSize)
  doc.setTextColor(headerStyle.color)
  doc.text(categoryTitle, offsetX, y)
  const textWidth = doc.getTextWidth(categoryTitle)
  doc.line(offsetX, y + 2, offsetX + textWidth, y + 2)
  return y + spacing
}

/**
 * Renders a single panel (test) on the PDF document.
 *
 * @param {jsPDF} doc - The jsPDF document instance.
 * @param {Object} panel - The panel configuration object.
 * @param {number} offsetX - The x-coordinate to begin rendering.
 * @param {number} y - The current y-coordinate.
 * @param {number} spacing - The vertical spacing between lines.
 * @returns {number} The updated y-coordinate after rendering the panel.
 */
function renderPanel(doc, panel, offsetX, y, spacing) {
  const panelNameStyle =
    panel.style || { font: 'Helvetica', fontStyle: 'bold', fontSize: 12, color: '#000000' }
  doc.setFont(panelNameStyle.font, panelNameStyle.fontStyle)
  doc.setFontSize(panelNameStyle.fontSize)
  doc.setTextColor(panelNameStyle.color)
  doc.text(panel.name, offsetX, y)
  y += spacing
  if (panel.genes && panel.genes.length > 0) {
    const panelGeneStyle =
      panel.geneStyle || { font: 'Helvetica', fontStyle: 'italic', fontSize: 10, color: '#000000' }
    doc.setFont(panelGeneStyle.font, panelGeneStyle.fontStyle)
    doc.setFontSize(panelGeneStyle.fontSize)
    doc.setTextColor(panelGeneStyle.color)
    const geneText = panel.genes.join(', ')
    const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40
    const lines = doc.splitTextToSize(geneText, maxWidth)
    lines.forEach(line => {
      doc.text(line, offsetX, y)
      y += spacing
    })
  }
  // Reset font settings to default.
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(12)
  return y
}

/**
 * Main function to generate the PDF document.
 *
 * Steps:
 * 1. Render main sections (header, body, panels, etc.).
 * 2. Wait for the QR code element to be rendered and add it to the first page.
 * 3. If available, load and add the pedigree image on a new page while preserving its aspect ratio.
 * 4. Add page numbering to all pages if enabled.
 * 5. Save the final PDF document.
 */
async function generatePdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' })
  const mapping = {
    ...props.patientData,
    ...pdfConfig.header,
    ...pdfConfig.footer
  }

  // Render header and body sections.
  if (pdfConfig.header) {
    renderSection(doc, pdfConfig.header, mapping)
  }
  if (pdfConfig.body) {
    renderSection(doc, pdfConfig.body, mapping)
  }

  // Render grouped test panels.
  const { baseY = 350, maxHeight = 600, spacing = 14, offsetX = 60, secondPageBaseY = 50 } =
    pdfConfig.panels || {}
  let y = baseY
  groupedPanels.value.forEach(group => {
    if (y + spacing > maxHeight) {
      doc.addPage()
      y = secondPageBaseY
    }
    y = renderCategoryHeader(doc, group.categoryTitle, offsetX, y, spacing)
    group.tests.forEach(panel => {
      let requiredHeight = spacing
      if (panel.genes && panel.genes.length > 0) {
        const geneText = panel.genes.join(', ')
        const maxWidth = doc.internal.pageSize.getWidth() - offsetX - 40
        const lines = doc.splitTextToSize(geneText, maxWidth)
        requiredHeight += lines.length * spacing
      }
      if (y + requiredHeight > maxHeight) {
        doc.addPage()
        y = secondPageBaseY
      }
      y = renderPanel(doc, panel, offsetX, y, spacing)
    })
  })

  // Render variant segregation details if provided.
  if (props.patientData.variantSegregationRequested && props.patientData.variantDetails) {
    if (y + spacing > maxHeight) {
      doc.addPage()
      y = secondPageBaseY
    }
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor('#000000')
    doc.text('Segregation familiärer Variante:', offsetX, y)
    y += spacing
    doc.setFont('Helvetica', 'normal')
    const variantLines = doc.splitTextToSize(
      props.patientData.variantDetails,
      doc.internal.pageSize.getWidth() - offsetX - 40
    )
    variantLines.forEach(line => {
      doc.text(line, offsetX, y)
      y += spacing
    })
  }

  if (pdfConfig.footer) {
    renderSection(doc, pdfConfig.footer, mapping)
  }

  // Wait until the QR code is rendered, then add it to page 1.
  await nextTick()
  const canvas = qrContainer.value?.querySelector('canvas')
  if (canvas && pdfConfig.qr?.position && pdfConfig.qr?.size) {
    doc.setPage(1)
    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      pdfConfig.qr.position.x,
      pdfConfig.qr.position.y,
      pdfConfig.qr.size.width,
      pdfConfig.qr.size.height
    )
  }

  // If a pedigree image exists, load it and add it as a new page.
  if (props.pedigreeDataUrl && props.pedigreeDataUrl !== '') {
    await new Promise((resolve) => {
      const img = new Image()
      img.src = props.pedigreeDataUrl
      img.onload = () => {
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 40
        const maxWidth = pageWidth - margin * 2
        const maxHeight = pageHeight - margin * 2
        // Calculate scale factor without upscaling.
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
        const drawWidth = img.width * scale
        const drawHeight = img.height * scale
        // Center the image on the new page.
        const offsetXImg = (pageWidth - drawWidth) / 2
        const offsetYImg = (pageHeight - drawHeight) / 2
        doc.addPage()
        doc.addImage(props.pedigreeDataUrl, 'PNG', offsetXImg, offsetYImg, drawWidth, drawHeight)
        resolve()
      }
      img.onerror = () => {
        console.error("Error loading pedigree image.")
        resolve() // Proceed even if the image fails to load.
      }
    })
  }

  // Add page numbering on all pages if enabled.
  const totalPages = doc.internal.getNumberOfPages()
  if (totalPages > 1 && pdfConfig.pageNumber && pdfConfig.pageNumber.enabled) {
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      const { x, y: posY } = pdfConfig.pageNumber.position
      const pageText = `Page ${p} of ${totalPages}`
      doc.setFont(pdfConfig.pageNumber.font || 'Helvetica', pdfConfig.pageNumber.fontStyle || 'normal')
      doc.setFontSize(pdfConfig.pageNumber.fontSize || 10)
      doc.setTextColor(pdfConfig.pageNumber.color || '#000000')
      doc.text(pageText, x, posY)
    }
  }

  // Save the final PDF document.
  doc.save('genetic_test_requisition.pdf')
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
