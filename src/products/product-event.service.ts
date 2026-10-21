import { Observable, Subject } from 'rxjs';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ProductEvent } from './types';

@Injectable()
export class ProductEventService implements OnModuleDestroy {
  private readonly events$ = new Subject<ProductEvent>();

  emit(event: ProductEvent): void {
    this.events$.next(event);
  }

  stream(): Observable<ProductEvent> {
    return this.events$.asObservable();
  }

  onModuleDestroy() {
    this.events$.complete();
  }
}
