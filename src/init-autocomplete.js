import { loadLocationIndex } from './location-index.js';
import { bindLocationAutocomplete } from './location-autocomplete.js';

async function init() {
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  if (!fromInput || !toInput) return;

  try {
    const index = await loadLocationIndex('./data/location-index.json');
    bindLocationAutocomplete(fromInput, index);
    bindLocationAutocomplete(toInput, index);
  } catch (error) {
    console.error('RailAtlas autocomplete failed', error);
  }
}

init();
