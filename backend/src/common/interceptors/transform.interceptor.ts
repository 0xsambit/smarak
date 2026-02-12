import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Remove MongoDB internal fields
        if (data && typeof data === 'object') {
          return this.cleanData(data);
        }
        return data;
      }),
    );
  }

  private cleanData(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.cleanData(item));
    }

    if (data && typeof data === 'object') {
      const cleaned = { ...data };

      // Remove MongoDB internal fields
      delete cleaned._id;
      delete cleaned.__v;

      // Recursively clean nested objects
      Object.keys(cleaned).forEach((key) => {
        if (cleaned[key] && typeof cleaned[key] === 'object') {
          cleaned[key] = this.cleanData(cleaned[key]);
        }
      });

      return cleaned;
    }

    return data;
  }
}
