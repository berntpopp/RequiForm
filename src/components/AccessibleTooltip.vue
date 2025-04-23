<template>
  <!-- 
    Accessible tooltip wrapper component that ensures tooltips
    have proper ARIA attributes for screen readers
  -->
  <div class="a11y-tooltip-wrapper">
    <slot></slot>
  </div>
</template>

<script setup>
/**
 * AccessibleTooltip - Accessibility enhancement for v-tooltip
 * 
 * This component adds appropriate ARIA attributes to tooltip elements 
 * to ensure screen readers can properly announce them.
 * 
 * @file AccessibleTooltip.vue - Accessibility wrapper for tooltips
 * @module components/AccessibleTooltip
 */
import { onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';

// After the component mounts, find tooltips within the wrapper and add ARIA attributes
onMounted(() => {
  // Use MutationObserver to detect when tooltips are added to the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Look for tooltips in the entire document (tooltips are mounted at the root level)
        const tooltips = document.querySelectorAll('.v-tooltip');
        tooltips.forEach(enhanceTooltipAccessibility);
      }
    });
  });

  // Start observing the document body for tooltip-related changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Store observer in the component instance
  const instance = getCurrentInstance();
  if (instance) {
    instance.tooltip_observer = observer;
  }
});

// Clean up observer on component unmount
onBeforeUnmount(() => {
  const instance = getCurrentInstance();
  if (instance && instance.tooltip_observer) {
    instance.tooltip_observer.disconnect();
  }
});

/**
 * Enhances the accessibility of a tooltip element
 * @param {HTMLElement} tooltip - The tooltip element to enhance
 */
function enhanceTooltipAccessibility(tooltip) {
  if (!tooltip || tooltip.hasAttribute('aria-label')) return;
  
  // Get the tooltip content
  const content = tooltip.textContent?.trim();
  if (content) {
    // Set the aria-label attribute on the tooltip element
    tooltip.setAttribute('aria-label', content);
    tooltip.setAttribute('role', 'tooltip');
  }
}
</script>

<style scoped>
.a11y-tooltip-wrapper {
  display: contents; /* This makes the wrapper not affect layout */
}
</style>
