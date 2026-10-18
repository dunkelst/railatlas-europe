import { searchLocations } from './location-index.js';

function labelFor(location) {
  const suffix = [location.type === 'station' ? 'Bahnhof' : location.type, location.country]
    .filter(Boolean)
    .join(' · ');
  return suffix ? `${location.name} · ${suffix}` : location.name;
}

export function bindLocationAutocomplete(input, source, { limit = 6, onSelect } = {}) {
  const host = input.parentElement;
  host.classList.add('location-field');

  const list = document.createElement('div');
  list.className = 'location-suggestions';
  list.hidden = true;
  host.appendChild(list);

  const feedback = document.createElement('div');
  feedback.className = 'location-feedback';
  feedback.hidden = true;
  host.appendChild(feedback);

  let selected = null;
  let activeIndex = -1;
  let matches = [];
  let renderToken = 0;

  async function find(query) {
    if (typeof source === 'function') return await source(query, { limit });
    if (source?.search && typeof source.search === 'function') return await source.search(query, { limit });
    return searchLocations(source, query, { limit });
  }

  function setFeedback(text, state = 'info') {
    feedback.textContent = text;
    feedback.dataset.state = state;
    feedback.hidden = !text;
  }

  function close() {
    list.hidden = true;
    list.innerHTML = '';
    activeIndex = -1;
    matches = [];
  }

  function clearSelection({ clearFeedback = false } = {}) {
    selected = null;
    delete input.dataset.locationId;
    delete input.dataset.bundleIds;
    if (clearFeedback) setFeedback('');
  }

  function choose(location) {
    selected = location;
    input.value = location.name;
    input.dataset.locationId = location.id;
    input.dataset.bundleIds = (location.bundle_ids ?? []).join(',');
    setFeedback(`✓ Gefunden: ${labelFor(location)}`, 'selected');
    close();
    onSelect?.(location);
  }

  async function render({ fromInput = false } = {}) {
    const token = ++renderToken;
    const query = input.value.trim();

    if (selected && query === selected.name && !fromInput) {
      setFeedback(`✓ Gefunden: ${labelFor(selected)}`, 'selected');
      return;
    }

    if (fromInput && selected && query !== selected.name) clearSelection();

    if (query.length < 2) {
      close();
      setFeedback('');
      return;
    }

    setFeedback('Suche Orte und Bahnhöfe…', 'searching');
    try {
      const result = await find(query);
      if (token !== renderToken) return;
      matches = result;
    } catch (error) {
      console.error('RailAtlas location search failed', error);
      if (token === renderToken) {
        close();
        setFeedback('Ortssuche fehlgeschlagen', 'error');
      }
      return;
    }

    list.innerHTML = '';
    activeIndex = -1;
    if (!matches.length) {
      close();
      setFeedback(`Kein Ort für „${query}“ gefunden`, 'error');
      return;
    }

    setFeedback(`${matches.length} Treffer gefunden – bitte auswählen`, 'matches');
    matches.forEach((location, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'location-suggestion';
      button.dataset.index = String(index);
      button.innerHTML = `<b>${location.name}</b><span>${labelFor(location).replace(`${location.name} · `, '')}</span>`;
      button.addEventListener('mousedown', event => {
        event.preventDefault();
        choose(location);
      });
      list.appendChild(button);
    });
    list.hidden = false;
  }

  input.addEventListener('input', () => render({ fromInput: true }));
  input.addEventListener('focus', () => render({ fromInput: false }));
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', event => {
    const items = [...list.querySelectorAll('.location-suggestion')];
    if (list.hidden || !items.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = event.key === 'ArrowDown'
        ? (activeIndex + 1) % items.length
        : (activeIndex - 1 + items.length) % items.length;
      items.forEach((item, index) => item.classList.toggle('active', index === activeIndex));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const location = matches[activeIndex];
      if (location) choose(location);
    } else if (event.key === 'Escape') {
      close();
    }
  });

  return {
    getSelected: () => selected,
    clear: () => {
      clearSelection({ clearFeedback: true });
      close();
    }
  };
}
