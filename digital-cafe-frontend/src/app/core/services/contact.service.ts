import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";

export interface ContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactMessageResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: "root" })
export class ContactService {
  private readonly endpoint = `${environment.apiUrl}/public/contact/message`;

  constructor(private http: HttpClient) {}

  submitMessage(
    data: ContactMessageRequest,
  ): Observable<ContactMessageResponse> {
    return this.http.post<ContactMessageResponse>(this.endpoint, data);
  }
}
