import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { take, tap, delay, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BookingData {
  dateFrom: string;
  dateTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private _bookings = new BehaviorSubject<Booking[]>([]);

  constructor(private authService: AuthService, private http: HttpClient) { }

  get bookings() {
    return this._bookings.asObservable();
  }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
    ) {
    let generatedID: string;
    let newBooking: Booking;
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('No se encontro el id del usuario!');
        }
        fetchedUserId = userId;
        return this.authService.token;
    }),
    take(1),
    switchMap(token => {
      newBooking = new Booking(
        Math.random().toString(),
        placeId,
        fetchedUserId,
        placeTitle,
        placeImage,
        firstName,
        lastName,
        guestNumber,
        dateFrom,
        dateTo
      );
      return this.http.post<{ name: string }>(`https://reservas-b5755.firebaseio.com/bookings.json?auth=${token}`, { ...newBooking, id: null });
    }),
      switchMap(resData => {
        generatedID = resData.name;
        return this.bookings;
      }),
      take(1),
      tap(bookings => {
        newBooking.id = generatedID;
        this._bookings.next(bookings.concat(newBooking));
      })
    );
  }

  cancelBooking(bookingId: string) {
    return this.authService.token.pipe(take(1), switchMap(token => {
      return this.http.delete(`https://reservas-b5755.firebaseio.com/bookings/${bookingId}.json?auth=${token}`);
    }),
    switchMap(() => {
      return this.bookings;
    }), take(1), tap(bookings => {
      this._bookings.next(bookings.filter(b => b.id !== bookingId));
    }));
  }

  fetchBookings() {
    let fetchedUserId: string;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if (!userId) {
        throw new Error('Usuario no encontrado!');
      }
      fetchedUserId = userId;
      return this.authService.token;
    }),
    take(1),
    switchMap(token => {
      return this.http.get<{ [key: string]: BookingData }>(
        `https://reservas-b5755.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${fetchedUserId}"&auth=${token}`);
    }),
    map(bookingData => {
        const bookings = [];
        for (const key in bookingData) {
          if (bookingData.hasOwnProperty(key)) {
            bookings.push(new Booking(
              key,
              bookingData[key].placeId,
              bookingData[key].userId,
              bookingData[key].placeTitle,
              bookingData[key].placeImage,
              bookingData[key].firstName,
              bookingData[key].lastName,
              bookingData[key].guestNumber,
              new Date(bookingData[key].dateFrom),
              new Date(bookingData[key].dateTo)
            ));
          }
        }
        return bookings;
      }), tap(bookings => {
        this._bookings.next(bookings);
      }));
  }
}
