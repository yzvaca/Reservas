import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { ModalController, ActionSheetController, AlertController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { PlaceLocation, Coordinates } from '../../../places/offers/location.model';
import { of } from 'rxjs';
import { Plugins, Capacitor } from '@capacitor/core';
import esri = __esri;
import Locator from 'arcgis-js-api/tasks/Locator';
import Point from 'arcgis-js-api/geometry/Point';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output() locationPick = new EventEmitter<PlaceLocation>();
  @Input() showPreview = false;
  locator: esri.Locator = null;
  selectedLocationImage: string;
  isLoading = false;

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController) { }

  ngOnInit() { }

  onPickLocation() {
    this.actionSheetCtrl.create({
      header: 'Por favor seleccione una opción',
      buttons: [
        {
          text: 'Ubicar Automáticamente', handler: () => {
            this.locateUser();
          }
        },
        {
          text: 'Seleccionar en el Mapa', handler: () => {
            this.openMap();
          }
        },
        { text: 'Cancelar', role: 'cancel' }
      ]
    })
      .then(actionSheetEl => {
        actionSheetEl.present();
      });
  }

  private locateUser() {
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.showErrorAlert();
      return;
    }
    Plugins.Geolocation.getCurrentPosition()
      .then(geoPosition => {
        const coordinates: Coordinates = {
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude
        };

        const pointProperties: esri.PointProperties = {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          spatialReference: { wkid: 4326 }
        };
        const point: esri.Point = new Point(pointProperties);

        this.createPlace(
          point,
          (coordinates.lng + 0.01).toString(),
          (coordinates.lat + 0.01).toString(),
          (coordinates.lng - 0.01).toString(),
          (coordinates.lat - 0.01).toString(),
        );
      })
      .catch(err => {
        this.showErrorAlert();
      });
  }

  private showErrorAlert() {
    this.alertCtrl.create({
      header: 'No se pudo obtener la ubicación.',
      message: 'Por favor use el mapa para obtener la ubicación!!!',
      buttons: ['Ok']
    }).then(alertEl => alertEl.present());
  }

  private createPlace(
    point: esri.Point,
    xmin: string,
    ymin: string,
    xmax: string,
    ymax: string
  ) {
    this.isLoading = true;
    const pickedLocation: PlaceLocation = {
      lat: point.latitude,
      lng: point.longitude,
      address: null,
      staticMapImageUrl: null
    };
    const locatorProperties: esri.LocatorProperties = {
      url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'
    };
    this.locator = new Locator(locatorProperties);
    this.locator.locationToAddress({ location: point }).then(addresCandidate => {
      if (!addresCandidate || !addresCandidate.address || addresCandidate.address.length === 0) {
        return null;
      }
      pickedLocation.address = addresCandidate.address;
    });
    return of(this.getMapImage(xmin, ymin, xmax, ymax))
      .subscribe(staticMapImageUrl => {
        pickedLocation.staticMapImageUrl = staticMapImageUrl;
        this.selectedLocationImage = staticMapImageUrl;
        this.isLoading = false;
        this.locationPick.emit(pickedLocation);
        console.log(pickedLocation);
      });
  }

  private openMap() {
    this.modalCtrl.create({ component: MapModalComponent }).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if (!modalData.data) {
          return;
        }
        this.createPlace(modalData.data.point, modalData.data.xmin, modalData.data.ymin, modalData.data.xmax, modalData.data.ymax);
      });
      modalEl.present();
    });
  }

  getMapImage(xmin: string, ymin: string, xmax: string, ymax: string) {
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/export?bbox=${xmin},${ymin},${xmax},${ymax}&bboxSR=4326&size=298,200&f=image`;
  }
}
