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
import { onMounted, defineExpose } from 'vue'
import logService from '@/services/logService'
// Import pedigreejs functions from the ES module build now located in src/vendor.
import { 
  pedigreejs, 
  pedigreejs_zooming, 
  pedigreejs_pedcache, 
  pedigreejs_io 
} from '@/vendor/pedigreejs.es.v3.0.0-rc8.js'

function initPedigree() {
  if (!pedigreejs || !pedigreejs_pedcache || !pedigreejs_io) {
    logService.error('pedigreejs libraries are not loaded.')
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
    logService.error('PedigreeJS initialization error: ' + msg, e)
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

/**
 * Gets the pedigree data structure in a PED format representation.
 * This extracts the actual pedigree data structure that can be encoded in a QR code.
 * 
 * @return {Object} The pedigree data object containing family relationships and properties
 */
function getPedigreeData() {
  try {
    // Get the pedigree dataset from the cache using pedigreejs_pedcache
    const opts = {
      targetDiv: 'pedigree',
      btn_target: 'pedigree_history'
    };
    
    // Get the current dataset from the cache
    const dataset = pedigreejs_pedcache.current(opts);
    logService.debug('[PedigreeDrawer] Raw pedigree dataset fetched from cache:', dataset);
    
    if (!dataset || dataset.length === 0) {
      logService.warn('[PedigreeDrawer] No pedigree data found in cache');
      return null;
    }
    
    // Create a standardized PED format array while keeping it ultra-compact
    // Standard PED format has 6 columns:
    // 1. Family ID
    // 2. Individual ID
    // 3. Paternal ID
    // 4. Maternal ID
    // 5. Sex (1=male, 2=female, other=unknown)
    // 6. Phenotype (-9/0=missing, 1=unaffected, 2=affected)
    
    // First, assign numeric IDs to all persons for compact representation
    const personIds = {};
    let idCounter = 1;
    
    // First pass - assign numeric IDs
    dataset.forEach(person => {
      const name = person.name || person.id || `p${idCounter}`;
      if (!personIds[name]) {
        personIds[name] = idCounter++;
      }
    });
    
    // Second pass - create PED format arrays for each person
    // We'll use arrays instead of objects for ultra-compact representation
    // Format: [famId, indId, patId, matId, sex, pheno]
    const pedData = [];
    
    dataset.forEach(person => {
      const name = person.name || person.id || `p${idCounter}`;
      const indId = personIds[name];
      
      // Standard PED format sex: 1=male, 2=female, other=unknown
      // This already matches our needed format
      const sex = person.sex === 'M' ? 1 : (person.sex === 'F' ? 2 : 0);
      
      // Get father ID if exists, or 0
      const patId = person.father ? (personIds[person.father] || 0) : 0;
      
      // Get mother ID if exists, or 0
      const matId = person.mother ? (personIds[person.mother] || 0) : 0;
      
      // Phenotype in PED: 2=affected, 1=unaffected, 0/−9=missing
      // Convert our affected status to standard PED phenotype
      const phenotype = person.affected ? 2 : 1;
      
      // For QR code, we use numeric family ID to save space
      const fam = 1; // Use constant family ID for simplicity
      
      // Create the ultra-compact PED format array
      // [famId, indId, patId, matId, sex, phenotype]
      pedData.push([fam, indId, patId, matId, sex, phenotype]);
    });
    
    // Sort by individual ID for consistency
    pedData.sort((a, b) => a[1] - b[1]);
    
    // Format code 2 = standard PED format
    const result = [2, pedData];
    
    logService.debug('[PedigreeDrawer] Final compact pedigree data prepared:', result);
    return result;
  } catch (error) {
    logService.error('[PedigreeDrawer] Error getting pedigree data:', error);
    return null;
  }
}

onMounted(() => {
  initPedigree()
})

// Expose functions for parent components
defineExpose({
  getPedigreeDataUrl,
  getPedigreeData,
  initPedigree
})
</script>

<style scoped>
.pedigree-container {
  min-height: 300px; /* Ensure it has height even before rendering */
  border: 1px solid #ccc;
  margin-bottom: 1em;
  position: relative; /* Needed if pedigreejs uses absolute positioning */
}

#pedigreejs {
  width: 100%;
  height: 100%;
}
</style>
