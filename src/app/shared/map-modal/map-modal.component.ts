import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Input, Renderer2} from '@angular/core';
import { ModalController } from '@ionic/angular';
import esri = __esri;
import Map from 'arcgis-js-api/Map';
import MapView from 'arcgis-js-api/views/MapView';
import Locator from 'arcgis-js-api/tasks/Locator';
import TextSymbol from 'arcgis-js-api/symbols/TextSymbol';
import Point from 'arcgis-js-api/geometry/Point';
import Graphic from 'arcgis-js-api/Graphic';
import * as watchUtils from 'arcgis-js-api/core/watchUtils';


@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})


export class MapModalComponent implements OnInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  @Input() center: Array<number> = [0.1278, 51.5074];
  @Input() selectable = true;
  @Input() closeButtonText = 'Cancelar';
  @Input() title = 'Elija un Lugar';
  view: esri.MapView = null;
  locator: esri.Locator = null;

  lat: string;
  lng: string;
  xMin: string;
  yMin: string;
  xMax: string;
  yMax: string;

  constructor(private modalCtrl: ModalController, private renderer: Renderer2) { }

  async initializeMap() {
    try {
      // Configure the Map
      const mapProperties = {
        basemap: 'streets'
      };

      const map = new Map(mapProperties);

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: 14,
        map
      };

      this.view = new MapView(mapViewProperties);
      await this.view.when();
      return this.view;
    } catch (error) {
      console.log('Esri: ', error);
    }
  }

  ngOnInit() {
    this.initializeMap().then(mapview => {
      this.renderer.addClass(this.mapViewEl.nativeElement, 'visible');
      watchUtils.init(mapview, 'stationary', () => {
        if (mapview.extent) {
          this.xMin = mapview.extent.xmin.toFixed(2);
          this.xMax = mapview.extent.xmax.toFixed(2);
          this.yMin = mapview.extent.ymin.toFixed(2);
          this.yMax = mapview.extent.ymax.toFixed(2);
        }
      });

      if (this.selectable) {
        mapview.on('click', (event) => {
          this.lat = event.mapPoint.latitude.toFixed(2);
          this.lng = event.mapPoint.longitude.toFixed(2);

          const locatorProperties: esri.LocatorProperties = {
            url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
          };
          this.locator = new Locator(locatorProperties);
          this.locator.locationToAddress({ location: event.mapPoint }).then(addresCandidate => {
            if (!addresCandidate || !addresCandidate.address || addresCandidate.address.length === 0) {
              return null;
            }
            this.modalCtrl.dismiss( {
              lat: this.lat,
              lng: this.lng,
              address: addresCandidate.address,
              xmin: this.xMin,
              ymin: this.yMin,
              xmax: this.xMax,
              ymax: this.yMax
            });
          });
        });
      } else {
        const textSymbol: esri.TextSymbol = new TextSymbol({
          text: '\ue61d',
          color: '#7A003C',
          font: {
            size: 30,
            family: 'CalciteWebCoreIcons'
          }
        });
        const pnt: esri.Point = new Point({
            latitude: this.center[1],
            longitude: this.center[0]
          }
        );
        const graphic: esri.Graphic = new Graphic({
          symbol: textSymbol,
          geometry: pnt
        });
        mapview.graphics.add(graphic);
      }
    });
  }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }
}
