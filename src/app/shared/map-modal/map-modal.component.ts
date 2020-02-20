import { Component, OnInit, ViewChild, ElementRef, OnDestroy, Input, Renderer2 } from '@angular/core';
import { ModalController } from '@ionic/angular';
import esri = __esri;
import Map from 'arcgis-js-api/Map';
import MapView from 'arcgis-js-api/views/MapView';

import TextSymbol from 'arcgis-js-api/symbols/TextSymbol';
import Point from 'arcgis-js-api/geometry/Point';
import Graphic from 'arcgis-js-api/Graphic';
import * as watchUtils from 'arcgis-js-api/core/watchUtils';
import * as webMercatorUtils from 'arcgis-js-api/geometry/support/webMercatorUtils';


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
  extent: esri.geometry.Extent = null;

  lat: number;
  lng: number;
  xMin: string;
  yMin: string;
  xMax: string;
  yMax: string;

  constructor(private modalCtrl: ModalController, private renderer: Renderer2) { }

  async initializeMap() {
    try {
      const mapProperties = {
        basemap: 'streets'
      };

      const map = new Map(mapProperties);

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

          this.extent = mapview.extent;
        }
      });

      if (this.selectable) {
        mapview.on('click', (event) => {
          const pnt = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
          const proj = webMercatorUtils.webMercatorToGeographic(this.extent);
          this.modalCtrl.dismiss({
            point: pnt,
            xmin: proj.extent.xmin,
            ymin: proj.extent.ymin,
            xmax: proj.extent.xmax,
            ymax: proj.extent.ymax
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
      this.view.container = null;
    }
  }
}
