import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { environment } from "@environments/environment";

export interface PostalLookupResult {
  cities: string[];
  states: string[];
}

export type PostalLookupResponse =
  | { status: "success"; data: PostalLookupResult }
  | { status: "not_found" }
  | { status: "error" };

@Injectable({ providedIn: "root" })
export class PostalPincodeService {
  private readonly apiUrl = `${environment.apiUrl}/postal/pincode`;
  private readonly cache = new Map<string, PostalLookupResponse>();

  constructor(private http: HttpClient) {}

  lookupPincode(pin: string): Observable<PostalLookupResponse> {
    if (this.cache.has(pin)) {
      return of(this.cache.get(pin)!);
    }

    return this.http.get<PostalLookupResponse>(`${this.apiUrl}/${pin}`).pipe(
      map((res) => {
        if (res?.status === "success" && res.data) {
          return {
            status: "success",
            data: {
              cities: res.data.cities || [],
              states: res.data.states || [],
            },
          } as const;
        }
        if (res?.status === "not_found") {
          return { status: "not_found" } as const;
        }
        return { status: "error" } as const;
      }),
      tap((result) => this.cache.set(pin, result)),
      catchError(() => {
        const errorResult: PostalLookupResponse = { status: "error" };
        this.cache.set(pin, errorResult);
        return of(errorResult);
      }),
    );
  }
}
