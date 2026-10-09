import { loadLocationIndex } from './location-index.js';
import { loadLocationCatalog } from './location-catalog.js';
import { bindLocationAutocomplete } from './location-autocomplete.js';

async function init() {
  const fromInput = document.getElementById('fromInput');
  const toInput = document.getElementById('toInput');
  if (!fromInput || !toInput) return;

  try {
    let source;
    try {
      source = await loadLocationCatalog('./data/location-catalog.json');
    } catch (catalogError) {
      console.warn('RailAtlas Europe catalog unavailable, using legacy location index', catalogError);
      source = await loadLocationIndex('./data/location-index.json');
    }
    bindLocationAutocomplete(fromInput, source);
    bindLocationAutocomplete(toInput, source);
  } catch (error) {
    console.error('RailAtlas autocomplete failed', error);
  }
}

init();
