import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, ModalController, ActionSheetController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from '../../places.service';
import { Place } from '../../places.model';
import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  private placeSub: Subscription;

  constructor(private navCtrl: NavController,
              private route: ActivatedRoute,
              private placesService: PlacesService,
              private modalCtrl: ModalController,
              private actionSheetCtrl: ActionSheetController) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('places/tabs/discover');
        return;
      }
      this.placeSub = this.placesService.getPlace(paramMap.get('placeId')).subscribe(place => {
        this.place = place;
      });
    });
  }

  onBookPlace() {
    // this.navCtrl.navigateBack('/places/tabs/discover');
    this.actionSheetCtrl.create({
      header: 'Elija una acción',
      buttons: [
        {
          text: 'Elija una fecha',
          handler: () => {
            this.openBookingModal('select');
          }
        },
        {
          text: 'Fecha aleatoria',
          handler: () => {
            this.openBookingModal('random');
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    })
    .then(actionSheetEl => {
      actionSheetEl.present();
    });
  }

  openBookingModal(mode: 'select' | 'random') {
    console.log(mode);
    this.modalCtrl
    .create({
      component: CreateBookingComponent,
      componentProps: {selectedPlace: this.place, selectedMode: mode}})
    .then(modalEl => {
      modalEl.present();
      return modalEl.onDidDismiss();
    })
    .then(resultData => {
      console.log(resultData.data, resultData.role);
      if (resultData.role === 'confirm') {
        console.log('Reservado!');
      }
    });
  }
  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
