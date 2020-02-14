import { Component, OnInit, ViewChild, ElementRef, OnDestroy} from '@angular/core';
import { ModalController } from '@ionic/angular';
import esri = __esri;
import Map from 'arcgis-js-api/Map';
import MapView from 'arcgis-js-api/views/MapView';


@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})


export class MapModalComponent implements OnInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;
  view: esri.MapView = null;

  constructor(private modalCtrl: ModalController) { }

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
        center: [0.1278, 51.5074],
        zoom: 10,
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
      mapview.on('click', (event) => {
        const selectedCoords = {
          lat: Math.round(event.mapPoint.latitude * 100000) / 100000,
          lng: Math.round(event.mapPoint.longitude * 100000) / 100000
        };
        this.modalCtrl.dismiss(selectedCoords);
      });
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
