import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { PlaceLocation } from '../../../places/offers/location.model';
import { of } from 'rxjs';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output() locationPick = new EventEmitter<PlaceLocation>();
  selectedLocationImage: string;
  isLoading = false;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}

  onPickLocation() {
    this.modalCtrl.create({ component: MapModalComponent}).then(modalEl => {
      modalEl.onDidDismiss().then(modalData => {
        if (!modalData.data) {
          return;
        }
        this.isLoading = true;
        const pickedLocation: PlaceLocation = {
          lat: modalData.data.lat,
          lng: modalData.data.lng,
          address: modalData.data.address,
          staticMapImageUrl: null
        };
        return of(this.getMapImage(modalData.data.xmin, modalData.data.ymin, modalData.data.xmax, modalData.data.ymax))
          .subscribe(staticMapImageUrl => {
            pickedLocation.staticMapImageUrl = staticMapImageUrl;
            this.selectedLocationImage = staticMapImageUrl;
            this.isLoading = false;
            this.locationPick.emit(pickedLocation);
          });
      });
      modalEl.present();
    });
  }

  getMapImage(xmin: string, ymin: string, xmax: string, ymax: string) {
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/export?bbox=${xmin},${ymin},${xmax},${ymax}&bboxSR=102100&size=298,200&f=image`;
  }
}
