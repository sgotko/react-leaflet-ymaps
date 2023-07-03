import React from 'react';
import { createRoot } from 'react-dom/client';
import "leaflet/dist/leaflet.css";

import { MapContainer} from "react-leaflet";
import { YandexLayer } from '../dist/index.js';
// import { YandexLayer } from '../src/index'; 

// console.log(YandexLayer)

// const a = YandexLayer.render();
// console.log(a)

const root = createRoot(document.getElementById('app'))
const App = () => {
 
	return <MapContainer
		center={[48.574041, 39.307815]}
                        zoom={8}
                        // scrollWheelZoom={true}
                        // attributionControl={false}
                        style={{ minHeight: "450px", width: "100%", zIndex: 2 }}
	>
					<YandexLayer url=""/>

                    </MapContainer>
}
root.render(<App/>)