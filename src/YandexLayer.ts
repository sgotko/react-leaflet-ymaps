import * as L from "leaflet";
import { TileLayerProps } from "react-leaflet";
import {
    createTileLayerComponent,
    LeafletContextInterface,
	LeafletElement
} from "@react-leaflet/core";
import { Yandex, YandexLayerOptions, YandexMapType } from "./Yandex";

const createLeafletElement = (
    props: TileLayerProps & Partial<YandexLayerOptions>,
    context: LeafletContextInterface
): LeafletElement<L.Layer, any> => {
    const instance = new Yandex(YandexMapType.map, { url: props.url });

    return { instance, context };
};

export default createTileLayerComponent<
    L.Layer,
    TileLayerProps & Partial<YandexLayerOptions>
>(createLeafletElement);
