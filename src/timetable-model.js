// Provider-neutral timetable contract. Keep timetable data separate from the
// physical RailGraph; operational-point IDs are the join key.

export function normalizeTimetableStop(stop = {}) {
  return {
    op_id: stop.op_id ?? null,
    eva: stop.eva ?? null,
    uic: stop.uic ?? null,
    ifopt: stop.ifopt ?? null,
    name: stop.name ?? null,
    arrival: stop.arrival ?? null,
    departure: stop.departure ?? null,
    platform: stop.platform ?? null,
    realtime: Boolean(stop.realtime),
  };
}

export function normalizeTimetableJourney(journey = {}) {
  return {
    id: journey.id ?? null,
    service_date: journey.service_date ?? null,
    provider: journey.provider ?? null,
    line: journey.line ?? null,
    train_number: journey.train_number ?? null,
    product: journey.product ?? null,
    destination: journey.destination ?? null,
    cancelled: Boolean(journey.cancelled),
    stops: (journey.stops ?? []).map(normalizeTimetableStop),
  };
}

export function timetableJourneyTouchesOps(journey, fromOpId, toOpId) {
  const ids = (journey?.stops ?? []).map(stop => stop.op_id).filter(Boolean);
  const from = ids.indexOf(fromOpId);
  const to = ids.lastIndexOf(toOpId);
  return from >= 0 && to > from;
}
