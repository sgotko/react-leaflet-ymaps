import * as L from "leaflet";
import ymaps from "ymaps";
export var YandexMapType;
(function (YandexMapType) {
  YandexMapType["map"] = "map";
  YandexMapType["satellite"] = "satellite";
  YandexMapType["hybrid"] = "hybrid";
  YandexMapType["mapVector"] = "map~vector";
  YandexMapType["overlay"] = "overlay";
  YandexMapType["skeleton"] = "skeleton";
})(YandexMapType || (YandexMapType = {}));
export class Yandex extends L.Layer {
  static defaultOptions = {
    url: "",
    mapOptions: {
      type: YandexMapType.map,
      baloonAutoPan: false,
      suppressMapOpenBlock: true,
      yandexMapDisablePoiInteractivity: true,
      opacity: 1,
    },
  };
  type;
  options;
  _animatedElements = [];
  _yandex = undefined;
  _container = undefined;
  _zoomAnimated = true;
  _ymaps;
  constructor(type = YandexMapType.map, options) {
    super();
    this.type = type;
    this.options = { ...options, ...Yandex.defaultOptions };
    L.Util.setOptions(this, options);
  }
  _setStyle(el, style) {
    for (let prop in style) {
      el.style[prop] = style[prop];
    }
  }
  _initContainer(parentEl) {
    let _container = L.DomUtil.create(
      "div",
      "leaflet-ymaps-container leaflet-pane leaflet-tile-pane"
    );
    L.DomUtil.setOpacity(_container, this.options.mapOptions.opacity);
    let auto = { width: "100%", height: "100%" };
    this._setStyle(parentEl, auto); // need to set this explicitly,
    this._setStyle(_container, auto); // otherwise ymaps fails to follow container size changes
    return _container;
  }
  async _initApi() {
    this._yandex = await ymaps.load(this.options.url);
    this._initMapObject();
  }
  onAdd(map) {
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
  beforeAdd(map) {
    map._addZoomLimit(this);
    return this;
  }
  onRemove(map) {
    map._removeZoomLimit(this);
    return this;
  }
  _destroy(e) {
    if (!this._map || this._map === e.target) {
      if (this._yandex) {
        this._yandex.destroy();
        delete this._yandex;
      }
      delete this._container;
    }
  }
  _setEvents(map) {
    let events = {
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
    this.onRemove(() => {
      map.off(events, this);
      this._container.remove(); // we do not call this until api is initialized (ymaps API expects DOM element)
    });
  }
  _update() {
    let map = this._map;
    let center = map.getCenter();
    this._yandex.setCenter([center.lat, center.lng], map.getZoom());
    let mapPane = map.getPane("mapPane");
    if (mapPane) {
      let offset = L.point(0, 0).subtract(L.DomUtil.getPosition(mapPane));
      L.DomUtil.setPosition(this._container, offset); // move to visible part of pane
    }
  }
  _resyncView() {
    // for use in addons
    if (!this._map) {
      return;
    }
    let ymap = this._yandex;
    this._map.setView(ymap.getCenter(), ymap.getZoom(), { animate: false });
  }
  _animateZoom(e) {
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
  _animateZoomEnd() {
    this._animatedElements.forEach(function (el) {
      L.DomUtil.setTransform(el, new L.Point(0, 0), 1);
    });
    this._animatedElements.length = 0;
  }
  _mapType() {
    return `yandex#${this.type}`;
  }
  _initMapObject() {
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
