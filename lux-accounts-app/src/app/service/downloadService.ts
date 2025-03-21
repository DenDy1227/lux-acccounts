import {inject, Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FileService {
// http = inject(HttpClient)
  /**
   * Save data as a JSON file
   */
  saveAsJsonFile(data: any[], fileName: string): void {
    const jsonData = JSON.stringify(data, null, 2);  // Pretty print JSON for readability
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);  // Clean up URL object
  }

  // getData(): Observable<any[]> {
  //   // return this.http.get<any[]>('./../../../assets/flatSource.ts');
  //   return this.http.get<any[]>('assets/flatSource.ts');
  // }
}
