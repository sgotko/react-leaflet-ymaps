import * as L from "leaflet";
import ymaps from "ymaps";

export enum YandexMapType {
    map = "map",
    satellite = "satellite",
    hybrid = "hybrid",
    mapVector = "map~vector",
    overlay = "overlay",
    skeleton = "skeleton",
}

// https://tech.yandex.com/maps/doc/jsapi/2.1/ref/reference/Map-docpage/#Map__param-options
export type YandexMapOptions = {
    baloonAutoPan?: boolean;
    suppressMapOpenBlock?: boolean;
    yandexMapDisablePoiInteractivity?: boolean;
};

export type YandexLayerOptions = {
    url?: string;
    opacity: number;
    mapOptions?: YandexMapOptions;
};

export class Yandex extends L.Layer {
    public static defaultOptions: YandexLayerOptions = {
        url: "",
        opacity: 1,
        mapOptions: {
            baloonAutoPan: false,
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true,
        },
    };

    private type: YandexMapType;
    private options: YandexLayerOptions;

    private _animatedElements: any[] = [];
    private _yandex: any = undefined;
    private _container: any = undefined;
    private _zoomAnimated: boolean = true;
    public _ymaps: any;

    public constructor(
        type: YandexMapType = YandexMapType.map,
        options: Partial<YandexLayerOptions>
    ) {
        super();
        this.type = type;
        this.options = { ...options, ...Yandex.defaultOptions };
        // this.initialize(type, options);
        L.Util.setOptions(this, options);
    }

    // public initialize(type, options) {
    //     // if (typeof type === "object") {
    //     //     options = type;
    //     //     type = false;
    //     // }
    //     L.Util.setOptions(this, options);
    //     // console.log(options1);
    //     // if (type) {
    //     //     options.type = type;
    //     // }
    // }

    public _setStyle(el, style) {
        for (let prop in style) {
            el.style[prop] = style[prop];
        }
    }

    public _initContainer(parentEl: HTMLElement | undefined) {
        let _container = L.DomUtil.create(
            "div",
            "leaflet-yandex-container leaflet-pane leaflet-tile-pane"
        );

        L.DomUtil.setOpacity(_container, this.options.opacity);

        let auto = { width: "100%", height: "100%" };
        this._setStyle(parentEl, auto); // need to set this explicitly,
        this._setStyle(_container, auto); // otherwise ymaps fails to follow container size changes
        return _container;
    }

    public async _initApi() {
        this._yandex = await ymaps.load(this.options.url);
        this._initMapObject();
    }

    public onAdd(map: L.Map) {
        let mapPane = map.getPane("mapPane");
        if (!this._container) {
            this._container = this._initContainer(mapPane);
            map.once("unload", this._destroy, this);
            this._initApi();
        }
        mapPane && mapPane.appendChild(this._container);
        if (this._yandex) {
            this._setEvents(map);
            this._update();
        }
        return this;
    }

    public beforeAdd(map) {
        map._addZoomLimit(this);
        return this;
    }

    public onRemove(map) {
        map._removeZoomLimit(this);
        return this;
    }

    public _destroy(e) {
        if (!this._map || this._map === e.target) {
            if (this._yandex) {
                this._yandex.destroy();
                delete this._yandex;
            }
            delete this._container;
        }
    }

    public _setEvents(map) {
        let events: any = {
            move: this._update,
            resize: function () {
                this._yandex.container.fitToViewport();
            },
        };
        if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
            events.zoomend = this._animateZoomEnd;
        }
        map.on(events, this);

        this.once(
            "remove",
            () => {
                map.off(events, this);
                this._container.remove(); // we do not call this until api is initialized (ymaps API expects DOM element)
            },
            this
        );
    }

    public _update() {
        let map = this._map;
        let center = map.getCenter();
        this._yandex.setCenter([center.lat, center.lng], map.getZoom());
        let mapPane = map.getPane("mapPane");

        if (mapPane) {
            let offset = L.point(0, 0).subtract(L.DomUtil.getPosition(mapPane));
            L.DomUtil.setPosition(this._container, offset); // move to visible part of pane
        }
    }

    public _resyncView() {
        // for use in addons
        if (!this._map) {
            return;
        }
        let ymap = this._yandex;
        this._map.setView(ymap.getCenter(), ymap.getZoom(), { animate: false });
    }

    public _animateZoom(e) {
        let map = this._map;
        let viewHalf = map.getSize().divideBy(2);
        let topLeft = map.project(e.center, e.zoom).subtract(viewHalf).round();
        let offset = map
            .project(map.getBounds().getNorthWest(), e.zoom)
            .subtract(topLeft);

        let scale = map.getZoomScale(e.zoom);
        this._animatedElements.length = 0;

        this._yandex.panes._array.forEach((el) => {
            let element = el.pane.getElement();
            L.DomUtil.addClass(element, "leaflet-zoom-animated");
            L.DomUtil.setTransform(element, offset, scale);
            this._animatedElements.push(element);
        }, this);
    }

    public _animateZoomEnd() {
        this._animatedElements.forEach(function (el) {
            L.DomUtil.setTransform(el, new L.Point(0, 0), 1);
        });
        this._animatedElements.length = 0;
    }

    public _mapType() {
        return `yandex#${this.type}`;
    }

    public _initMapObject() {
        this._yandex.mapType.storage.add(
            "yandex#overlay",
            new this._yandex.MapType("overlay", [])
        );
        this._yandex.mapType.storage.add(
            "yandex#skeleton",
            new this._yandex.MapType("skeleton", ["yandex#skeleton"])
        );
        this._yandex.mapType.storage.add(
            "yandex#map~vector",
            new this._yandex.MapType("map~vector", ["yandex#map~vector"])
        );

        const ymap = new this._yandex.Map(
            this._container,
            {
                center: [0, 0],
                zoom: 0,
                behaviors: [],
                controls: [],
                type: this._mapType(),
            },
            this.options.mapOptions
        );
        this._ymaps = this._yandex;

        this._container.remove();
        this._yandex = ymap;
        if (this._map) {
            this.onAdd(this._map);
        }

        this.fire("load");
    }
}
