"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {initialLanguage,LANGUAGES,LANGUAGE_KEY,localeFor,translate,validLanguage} from '@/lib/i18n.mjs';
export type Language='de'|'en'|'es';
type LocaleContext={language:Language;locale:string;setLanguage:(value:Language)=>void;t:(message:string,values?:Record<string,string|number>|(string|number)[])=>string};
const Context=createContext<LocaleContext>({language:'de',locale:'de-DE',setLanguage:()=>{},t:message=>message});
export function LocaleProvider({children}:{children:React.ReactNode}){
 const [language,update]=useState<Language>('de'),[ready,setReady]=useState(false);
 useEffect(()=>{let stored='';try{stored=localStorage.getItem(LANGUAGE_KEY)||'';}catch{}update(initialLanguage(location.search,stored));setReady(true);},[]);
 useEffect(()=>{if(!ready)return;document.documentElement.lang=language;document.title=translate(language,'RailAtlas · Europa und Mexiko');try{localStorage.setItem(LANGUAGE_KEY,language);}catch{}},[language,ready]);
 const setLanguage=useCallback((value:Language)=>{if(!validLanguage(value))return;update(value);try{const url=new URL(location.href);url.searchParams.set('lang',value);history.replaceState(history.state,'',url);}catch{}},[]);
 const value=useMemo(()=>({language,locale:localeFor(language),setLanguage,t:(message:string,values?:Record<string,string|number>|(string|number)[])=>translate(language,message,values)}),[language,setLanguage]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useLocale=()=>useContext(Context);
export function LanguagePicker(){const {language,setLanguage,t}=useLocale();return <label className="language-picker"><span>{t('Sprache')}</span><select aria-label={t('Sprache')} value={language} onChange={e=>setLanguage(e.target.value as Language)}>{LANGUAGES.map(l=><option key={l.id} value={l.id} lang={l.id}>{l.name}</option>)}</select></label>;}
