import { createTileLayerComponent } from "@react-leaflet/core";
import { Yandex, YandexMapType } from "./Yandex";
const createLeafletElement = (props, context) => {
  const instance = new Yandex(YandexMapType.map, { url: props.url });
  return { instance, context };
};
export default createTileLayerComponent(createLeafletElement);
