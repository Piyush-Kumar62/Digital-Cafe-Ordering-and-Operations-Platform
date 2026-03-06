import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { ApiService } from "@core/services/api.service";
import { Cafe } from "@shared/models/cafe.model";

@Injectable({ providedIn: "root" })
export class CafeContextService {
  private allCafesSub = new BehaviorSubject<Cafe[]>([]);
  private activeCafeSub = new BehaviorSubject<Cafe | null>(null);

  allCafes$ = this.allCafesSub.asObservable();
  activeCafe$ = this.activeCafeSub.asObservable();

  get allCafes(): Cafe[] {
    return this.allCafesSub.value;
  }

  get activeCafe(): Cafe | null {
    return this.activeCafeSub.value;
  }

  constructor(private api: ApiService) {}

  /** Load (or refresh) all owned cafes and restore the last selection. */
  loadCafes(): Observable<Cafe[]> {
    return this.api.getMyCafes().pipe(
      tap((cafes) => {
        this.allCafesSub.next(cafes || []);
        const savedId = localStorage.getItem("owner_active_cafe_id");
        const saved = savedId
          ? (cafes || []).find((c) => c.id === +savedId)
          : null;
        this.activeCafeSub.next(saved || (cafes && cafes[0]) || null);
      }),
    );
  }

  setActiveCafe(cafe: Cafe): void {
    this.activeCafeSub.next(cafe);
    localStorage.setItem("owner_active_cafe_id", String(cafe.id));
  }

  clear(): void {
    this.allCafesSub.next([]);
    this.activeCafeSub.next(null);
    localStorage.removeItem("owner_active_cafe_id");
  }
}
