<template>
  <v-card class="mb-4">
    <v-card-title>
      Pedigree Chart
    </v-card-title>
    <v-card-text>
      <!-- The "pedigree" container is where pedigreejs will render the chart -->
      <div id="pedigree" class="pedigree-container"></div>
      <div id="pedigree_history"></div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { onMounted, ref, defineExpose } from 'vue'
// Import pedigreejs functions from the ES module build now located in src/vendor.
import { 
  pedigreejs, 
  pedigreejs_zooming, 
  pedigreejs_pedcache, 
  pedigreejs_io 
} from '@/vendor/pedigreejs.es.v3.0.0-rc8.js'

const isFullScreen = ref(false)

function initPedigree() {
  if (!pedigreejs || !pedigreejs_pedcache || !pedigreejs_io) {
    console.error('pedigreejs libraries are not loaded.')
    return
  }

  // Ensure that a container with id "pedigreejs" exists inside the main "pedigree" div.
  let container = document.getElementById('pedigreejs')
  const ped = document.getElementById('pedigree')
  if (!container && ped) {
    container = document.createElement('div')
    container.id = 'pedigreejs'
    ped.appendChild(container)
  }

  let opts = {
    targetDiv: 'pedigree',
    btn_target: 'pedigree_history',
    width: 650,
    height: 400,
    symbol_size: 35,
    store_type: 'session',
    // Define disease with type "affected"
    diseases: [{ type: 'affected', colour: '#F68F35' }],
    labels: [], // no labels in this minimal example
    font_size: '.75em',
    font_family: 'Helvetica',
    font_weight: 700,
    edit: true,
    DEBUG: false
  }

  // Simple dataset: father, mother, and a child marked as affected.
  const simpleDataset = [
    { name: "father", sex: "M", top_level: true },
    { name: "mother", sex: "F", top_level: true },
    { name: "child", sex: "F", father: "father", mother: "mother", proband: true, affected: true }
  ]

  // Retrieve stored pedigree data if available; otherwise use the simple dataset.
  const localDataset = pedigreejs_pedcache.current(opts)
  opts.dataset = (localDataset !== undefined && localDataset !== null && localDataset.length > 0)
    ? localDataset
    : simpleDataset

  // Initialize pedigreejs using the build() function.
  try {
    // Use let builtOpts to capture the built options.
    let builtOpts = pedigreejs.build(opts)
    pedigreejs_zooming.scale_to_fit(builtOpts)
  } catch (e) {
    let msg = ''
    if (typeof e === 'string') {
      msg = e.toUpperCase()
    } else if (e instanceof Error) {
      msg = e.message
    }
    console.error('PedigreeJS ::: ' + msg, e)
  }
}

/**
 * Converts the pedigree SVG to a PNG data URL.
 * @return {Promise<string>} A promise that resolves to the PNG data URL.
 */
function getPedigreeDataUrl() {
  return new Promise((resolve, reject) => {
    try {
      const svgElement = document.querySelector('#pedigree svg')
      if (!svgElement) {
        resolve('')
        return
      }
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const width = svgElement.getAttribute('width') || 450
      const height = svgElement.getAttribute('height') || 320
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        resolve(dataUrl)
      }
      img.onerror = (err) => reject(err)
    } catch (error) {
      reject(error)
    }
  })
}

onMounted(() => {
  initPedigree()
})

// Expose getPedigreeDataUrl so that parent components can retrieve the pedigree image.
defineExpose({ getPedigreeDataUrl })
</script>

<style scoped>
.pedigree-container {
  border: 1px solid #ccc;
  padding: 8px;
}
.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 9999;
}
</style>
