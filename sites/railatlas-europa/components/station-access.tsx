"use client";
import type {Station} from '@/lib/types';
import {stationAccess} from '@/lib/station-access.mjs';
import {useLocale} from '@/components/locale';
export default function StationAccess({station}:{station:Station}){
 const {t}=useLocale(),guide=stationAccess(station);if(!guide)return null;
 return <aside className="station-access" aria-label={t('Anreise zum Bahnhof')}><b>{guide.title}</b><p>{t(guide.text)}</p><a href={guide.url} target="_blank" rel="noreferrer">{t(guide.source)}</a><small>{t('Zubringerhinweis zur Orientierung. Abfahrten und Umsteigezeit sind in dieser Reise nicht berechnet.')}</small></aside>;
}
