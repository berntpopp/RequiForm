import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css'; // Import default Shepherd CSS

/**
 * Initializes and configures the Shepherd tour instance.
 * Includes default options and step definitions.
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
          text: 'Back',
        },
        {
          action() {
            return this.next();
          },
          text: 'Next',
        },
      ],
    },
  });

  // --- Define Tour Steps ---
  tour.addStep({
    id: 'welcome',
    text: 'Welcome to RequiForm! This tour will guide you through the main features.',
    attachTo: { element: '#app', on: 'center' }, // Attach loosely to the app container
    buttons: [
      {
        action() {
          // Optionally set a flag in localStorage to not show again immediately
          localStorage.setItem('requiformTourCompleted', 'true');
          return this.cancel();
        },
        secondary: true,
        text: 'Skip',
      },
       {
        action() {
          return this.next();
        },
        text: 'Start Tour',
      },
    ],
  });

  tour.addStep({
    id: 'patient-form',
    text: 'Start by entering the patient information in this section.',
    attachTo: { element: '#patient-form-component', on: 'bottom' }, // Assuming PatientForm has this ID
    when: {
      // Ensure the element is visible before showing the step
      show: () => document.querySelector('#patient-form-component')
    }
  });

  tour.addStep({
    id: 'test-selector',
    text: 'Select the required genetic tests here.',
    attachTo: { element: '#test-selector-component', on: 'bottom' }, // Assuming TestSelector has this ID
    when: {
      show: () => document.querySelector('#test-selector-component')
    }
  });

  tour.addStep({
    id: 'phenotypes',
    text: 'Add relevant HPO phenotypes for the patient.',
    attachTo: { element: '#phenotype-selector-component', on: 'bottom' }, // Assuming PhenotypeSelector has this ID
    when: {
      show: () => document.querySelector('#phenotype-selector-component')
    }
  });

  tour.addStep({
    id: 'top-bar-actions',
    text: 'Use the top bar actions like Generate PDF, Copy URL, etc.',
    attachTo: { element: '#top-bar-actions', on: 'bottom' }, // Assuming a container for buttons in TopBar
    when: {
      show: () => document.querySelector('#top-bar-actions')
    }
  });

  tour.addStep({
    id: 'generate-pdf',
    text: 'Once the form is complete, generate the PDF request form using this button.',
    attachTo: { element: '#generate-pdf-btn', on: 'left' }, // Assuming the Generate PDF button has this ID
    when: {
      show: () => document.querySelector('#generate-pdf-btn')
    }
  });

  tour.addStep({
    id: 'tour-complete',
    text: 'You have completed the tour! You can restart it anytime from the Help menu.',
    buttons: [
      {
        action() {
          return this.complete();
        },
        text: 'Finish',
      },
    ],
  });

  // Handle tour completion/cancellation
  tour.on('complete', () => {
    console.log('Tour completed!');
    localStorage.setItem('requiformTourCompleted', 'true'); // Mark as completed
  });

  tour.on('cancel', () => {
    console.log('Tour cancelled.');
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
