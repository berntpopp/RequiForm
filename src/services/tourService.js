import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css'; // Import default Shepherd CSS
import logService from '@/services/logService'; // Import logService
import i18n from '@/i18n'; // Import the i18n instance

/**
 * Initializes and configures the Shepherd tour instance.
 * Includes default options and step definitions using i18n.
 */
function initializeTour() {
  const tour = new Shepherd.Tour({
    useModalOverlay: true, // Dim the background
    defaultStepOptions: {
      classes: 'shepherd-theme-arrows shepherd-custom', // Apply default theme and a custom class
      scrollTo: { behavior: 'smooth', block: 'center' }, // Smooth scroll to highlighted element
      cancelIcon: {
        enabled: true,
      },
      buttons: [
        {
          action() {
            return this.back();
          },
          secondary: true,
          text: i18n.global.t('tour.buttons.back'), // Use i18n
        },
        {
          action() {
            return this.next();
          },
          text: i18n.global.t('tour.buttons.next'), // Use i18n
        },
      ],
    },
  });

  // --- Define Tour Steps --- 
  tour.addStep({
    id: 'welcome',
    text: i18n.global.t('tour.welcome.text'), // Use i18n
    attachTo: { element: '#app', on: 'center' }, // Attach loosely to the app container
    buttons: [
      {
        action() {
          // Optionally set a flag in localStorage to not show again immediately
          localStorage.setItem('requiformTourCompleted', 'true');
          return this.cancel();
        },
        secondary: true,
        text: i18n.global.t('tour.buttons.skip'), // Use i18n
      },
       {
        action() {
          return this.next();
        },
        text: i18n.global.t('tour.buttons.start'), // Use i18n
      },
    ],
  });

  tour.addStep({
    id: 'patient-form',
    text: i18n.global.t('tour.patientForm.text'), // Use i18n
    attachTo: { element: '#patient-form-component', on: 'bottom' }, // Assuming PatientForm has this ID
    when: {
      // Ensure the element is visible before showing the step
      show: () => document.querySelector('#patient-form-component')
    }
  });

  tour.addStep({
    id: 'test-selector',
    text: i18n.global.t('tour.testSelector.text'), // Use i18n
    attachTo: { element: '#test-selector-component', on: 'bottom' }, // Assuming TestSelector has this ID
    when: {
      show: () => document.querySelector('#test-selector-component')
    }
  });

  tour.addStep({
    id: 'phenotypes',
    text: i18n.global.t('tour.phenotypes.text'), // Use i18n
    attachTo: { element: '#phenotype-selector-component', on: 'bottom' }, // Assuming PhenotypeSelector has this ID
    when: {
      show: () => document.querySelector('#phenotype-selector-component')
    }
  });

  tour.addStep({
    id: 'top-bar-actions',
    text: i18n.global.t('tour.topBarActions.text'), // Use i18n
    attachTo: { element: '#top-bar-actions', on: 'bottom' }, // Assuming a container for buttons in TopBar
    when: {
      show: () => document.querySelector('#top-bar-actions')
    }
  });

  tour.addStep({
    id: 'generate-pdf',
    text: i18n.global.t('tour.generatePdf.text'), // Use i18n
    attachTo: { element: '#generate-pdf-btn', on: 'left' }, // Assuming the Generate PDF button has this ID
    when: {
      show: () => document.querySelector('#generate-pdf-btn')
    }
  });

  tour.addStep({
    id: 'tour-complete',
    text: i18n.global.t('tour.complete.text'), // Use i18n
    buttons: [
      {
        action() {
          return this.complete();
        },
        text: i18n.global.t('tour.buttons.finish'), // Use i18n
      },
    ],
  });

  // Handle tour completion/cancellation
  tour.on('complete', () => {
    logService.info(i18n.global.t('tour.completed')); // Use i18n
    localStorage.setItem('requiformTourCompleted', 'true'); // Mark as completed
  });

  tour.on('cancel', () => {
    logService.info(i18n.global.t('tour.cancelled')); // Use i18n
    // Decide if cancelling should also mark it as "completed" for future visits
    // localStorage.setItem('requiformTourCompleted', 'true');
  });

  return tour;
}

// Function to check if the tour should be shown (e.g., first visit)
function shouldShowTour() {
  return !localStorage.getItem('requiformTourCompleted');
}

export { initializeTour, shouldShowTour };
