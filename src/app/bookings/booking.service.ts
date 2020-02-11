import { Injectable } from '@angular/core';
import { Booking } from './booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private _bookings: Booking[] = [
    {
      id: 'xyz',
      placeId: 'p1',
      placeTitle: 'Casanga',
      guestnumber: 4,
      userId: 'abc'
    }
  ];

  constructor() { }

  get bookings() {
    return [...this._bookings];
  }
}