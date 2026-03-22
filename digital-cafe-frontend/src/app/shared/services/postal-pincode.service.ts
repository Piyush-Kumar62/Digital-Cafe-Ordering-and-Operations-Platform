import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";

interface PostalApiResponse {
  Status: string;
  PostOffice?: Array<{ District: string; State: string }>;
}

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
  private readonly apiUrl = "https://api.postalpincode.in/pincode";
  private readonly cache = new Map<string, PostalLookupResponse>();

  constructor(private http: HttpClient) {}

  lookupPincode(pin: string): Observable<PostalLookupResponse> {
    if (this.cache.has(pin)) {
      return of(this.cache.get(pin)!);
    }

    return this.http.get<PostalApiResponse[]>(`${this.apiUrl}/${pin}`).pipe(
      map((res) => {
        const first = res?.[0];
        if (!first || first.Status !== "Success" || !first.PostOffice?.length) {
          return { status: "not_found" } as const;
        }
        const cities = Array.from(
          new Set(first.PostOffice.map((office) => office.District).filter(Boolean)),
        );
        const states = Array.from(
          new Set(first.PostOffice.map((office) => office.State).filter(Boolean)),
        );
        return { status: "success", data: { cities, states } } as const;
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
