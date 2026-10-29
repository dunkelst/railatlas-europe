import mexicoSearchArea from './mexico-search-area.mjs';
export const REGIONS={
 europe:{label:'Europa',bounds:[27,-32,84,70],centre:[49.3,8.5],zoom:5,timeZone:'Europe/Berlin'},
 mexico:{label:'Mexiko',bounds:[14.3,-118.5,32.8,-86.5],centre:[23.6,-102.5],zoom:5,timeZone:'America/Mexico_City'},
};
function insideRing(lat,lon,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [x,y]=points[i],[px,py]=points[j];if((y>lat)!==(py>lat)&&lon<(px-x)*(lat-y)/(py-y)+x)inside=!inside;}return inside;}
export const withinRegion=(lat,lon,region)=>{const [s,w,n,e]=REGIONS[region].bounds;if(!(lat>=s&&lat<=n&&lon>=w&&lon<=e))return false;return region!=='mexico'||mexicoSearchArea.some(r=>!r.exclude&&insideRing(lat,lon,r.points))&&!mexicoSearchArea.some(r=>r.exclude&&insideRing(lat,lon,r.points));};
export const mexicanBounds=b=>b[0]>=14.3&&b[2]<=32.8&&b[1]>=-118.5&&b[3]<=-86.5;
// City centres for navigation and bounded acceptance probes, never station data.
export const MEXICO_PLACES=[
 ['agu','Aguascalientes',21.8818,-102.2916],['bcn','Mexicali',32.6245,-115.4523,'America/Tijuana'],
 ['bcs','La Paz',24.1426,-110.3128,'America/Mazatlan'],['cam','Campeche',19.8451,-90.523],
 ['chp','Tuxtla Gutiérrez',16.753,-93.115],['chh','Chihuahua',28.633,-106.069,'America/Chihuahua'],
 ['coa','Saltillo',25.4232,-101.0053],['col','Colima',19.2452,-103.7241],
 ['dur','Durango',24.0277,-104.6532],['gua','Guanajuato',21.019,-101.2574],
 ['gro','Chilpancingo',17.5515,-99.5006],['hid','Pachuca',20.1011,-98.7591],
 ['jal','Guadalajara',20.6736,-103.344],['mex','Toluca',19.2826,-99.6557],
 ['mic','Morelia',19.706,-101.195],['mor','Cuernavaca',18.924,-99.222],
 ['nay','Tepic',21.5085,-104.895,'America/Mazatlan'],['nle','Monterrey',25.6866,-100.3161],
 ['oax','Oaxaca de Juárez',17.063,-96.726],['pue','Puebla',19.0433,-98.2019],
 ['que','Querétaro',20.5888,-100.3899],['roo','Chetumal',18.5001,-88.2961,'America/Cancun'],
 ['slp','San Luis Potosí',22.1565,-100.9855],['sin','Culiacán',24.8091,-107.394,'America/Mazatlan'],
 ['son','Hermosillo',29.0729,-110.9559,'America/Hermosillo'],['tab','Villahermosa',17.9895,-92.9475],
 ['tam','Ciudad Victoria',23.7369,-99.1411],['tla','Tlaxcala',19.3182,-98.2375],
 ['ver','Xalapa',19.5438,-96.9102],['yuc','Mérida',20.9674,-89.5926],
 ['zac','Zacatecas',22.7709,-102.5832],['cdmx','Ciudad de México',19.4326,-99.1332],
 ['playa','Playa del Carmen',20.627,-87.0733,'America/Cancun'],['cancun','Cancún',21.1619,-86.8515,'America/Cancun'],
 ['tulum','Tulum',20.2114,-87.4654,'America/Cancun'],['tijuana','Tijuana',32.5149,-117.0382,'America/Tijuana'],
 ['puerto','Puerto Escondido',15.864,-97.071],['salina','Salina Cruz',16.185,-95.207],
 ['jilotepec','Jilotepec',19.9526,-99.5327],['zamora','Zamora',19.985,-102.2834],
 ['uruapan','Uruapan',19.4206,-102.0626],['zitacuaro','Zitácuaro',19.4361,-100.3573],['ixmiquilpan','Ixmiquilpan',20.4858,-99.2187],
].map(([id,label,lat,lon,timeZone])=>({id:String(id),label:String(label),centre:[Number(lat),Number(lon)],timeZone:String(timeZone||'America/Mexico_City')}));
export const TIME_ZONES=['Europe/Berlin','America/Mexico_City','America/Cancun','America/Mazatlan','America/Hermosillo','America/Chihuahua','America/Tijuana','America/Monterrey','America/Merida','America/Matamoros','America/Ojinaga','America/Ciudad_Juarez','America/Bahia_Banderas'];
