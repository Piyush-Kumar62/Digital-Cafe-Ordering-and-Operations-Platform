import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { ApiService } from "@core/services/api.service";
import { Institution } from "@shared/models/education.model";

@Injectable({
  providedIn: "root",
})
export class EducationDataService {
  private degreesCache: string[] | null = null;
  private branchesCache = new Map<string, string[]>();

  constructor(private apiService: ApiService) {}

  getDegreeOptions(): Observable<string[]> {
    if (this.degreesCache) {
      return of([...this.degreesCache]);
    }
    return this.apiService.getDegrees().pipe(
      map((rows) => rows.map((d) => d.name).filter(Boolean)),
      tap((list) => {
        this.degreesCache = [...list];
      }),
      catchError(() => of([])),
    );
  }

  getBranchOptions(degree: string): Observable<string[]> {
    const key = String(degree || "").trim();
    if (!key) {
      return of([]);
    }
    if (this.branchesCache.has(key)) {
      return of([...(this.branchesCache.get(key) || [])]);
    }
    return this.apiService.getBranches(undefined, key).pipe(
      map((rows) => rows.map((b) => b.name).filter(Boolean)),
      tap((list) => {
        this.branchesCache.set(key, [...list]);
      }),
      catchError(() => of([])),
    );
  }

  searchInstitutions(term: string): Observable<Institution[]> {
    const query = String(term || "").trim();
    if (query.length < 2) {
      return of([]);
    }

    return this.apiService.searchInstitutions(query).pipe(
      map((results) => (Array.isArray(results) ? results : [])),
      catchError(() => of([])),
    );
  }
}
