import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable, Subscription } from 'rxjs';
import { ConfigService } from './config.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CookiesExpiredComponent } from 'app/dialogs/cookies-expired/cookies-expired.component';
import * as moment from 'moment';
import { ToolsService } from './tools.service';

declare var XML, JKL: any

@Injectable()
export class ApiService {

  corpintra: boolean = false

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    private dialog: MatDialog,
    private tools: ToolsService
  ) {
    this.corpintra = location.hostname.indexOf('corpintra.net') > -1
    if (!this.corpintra) {
      const datum = moment().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')
      for (let prop in this.reportDates) {
        this.reportDates[prop] = datum
      }
    }
  }

  reportDates = {
    orderIntake: '',
    productionProgram: '',
    allocation: '',
    plantStock: ''
  }

  reloadDialog: MatDialogRef<CookiesExpiredComponent>

  openCookiesPopup(): void {
    if (!this.reloadDialog) this.reloadDialog = this.dialog.open(CookiesExpiredComponent, {
      panelClass: 'newUpdate',
      disableClose: true,
      closeOnNavigation: false
    })
  }

  authorized: boolean = true

  heartbeat: Subscription

  cognosLink(url): string {
    return url.replace('80', '443').replace('http:', 'https:')
  }

  transcode(data) {
    const xotree = new XML.ObjTree()
    const dumper = new JKL.Dumper()
    return JSON.parse(dumper.dump(xotree.parseXML(data)))
  }

  htmlToJson(data, element): any[] {
    const htmlDoc = new DOMParser().parseFromString(data, "text/html")
    const table = htmlDoc.querySelectorAll(element)
    const rows = []
    for (let i = 0; i < table.length; i++) {
      const row = []
      for (let t = 0; t < table[i].childNodes.length; t++) {
        row.push(table[i].childNodes[t].innerText)
      }
      rows.push(row)
    }
    rows.shift()
    return rows
  }

  getLastReportLink(json, dateEntry: string): string {
    if (Array.isArray(json.feed.entry)) {
      json.feed.entry.forEach(function (entry, i) {
        if (entry.title['#text'] == 'HTML') {
          this.reportDates[dateEntry] = json.feed.entry[i].updated
          return json.feed.entry[i].link['-href']
        }
      })
    } else {
      this.reportDates[dateEntry] = json.feed.entry.updated
      return json.feed.entry.link['-href']
    }
  }

  // Get Order Intake Data from Report (temporarily from JSON File)
  getOrderIntakeData(ReportID: string): Observable<{ success: boolean, data?: any[], error?: string, more?: any }> {
    if (this.corpintra) {
      return new Observable(observer => {
        this.http.get('/internal/bi/v1/objects/' + ReportID + '/versions', { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
          const nextLink = json.data[0]._meta.links.outputs.url
          this.http.get(nextLink, { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
            const nextLink = json.data[0]._meta.links.content.url
            this.reportDates.orderIntake = json.data[0].modificationTime
            this.http.get(nextLink, { responseType: 'text', headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe(data => {
              const rows = this.htmlToJson(data, '[lid=AMVARA_DATA_OI] tr')
              rows.forEach((row, index, rows) => {
                this.config.config.reports.trucks.columns.orderIntake.shouldBeNumber.forEach(num => {
                  rows[index][num] = isNaN(rows[index][num]) ? 0 : parseFloat(rows[index][num])
                })
              })
              observer.next({ success: true, data: rows })
              observer.complete()
            }, err => {
              observer.next({ success: false, data: [], error: 'OI - Fail at getting report table data.', more: err })
              observer.complete()
            })
          }, err => {
            observer.next({ success: false, data: [], error: 'OI - Fail at getting last report versions.', more: err })
            observer.complete()
          })
        }, err => {
          observer.next({ success: false, data: [], error: 'OI - Fail at retrieving report info.', more: err })
          observer.complete()
        })
      })
    } else {
      return new Observable(observer => {
        this.http.get('assets/reports/order_intake.json').subscribe((res: any[]) => {
          observer.next({ success: true, data: res })
          observer.complete()
        })
      })
    }
  }
  // Get Production Program Data from Report (tmp JSON file)
  getProductionProgramData(ReportID: string): Observable<{ success: boolean, data?: any[], error?: string, more?: any }> {
    if (this.corpintra) {
      return new Observable(observer => {
        this.http.get('/internal/bi/v1/objects/' + ReportID + '/versions', { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
          const nextLink = json.data[0]._meta.links.outputs.url
          this.http.get(nextLink, { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
            const nextLink = json.data[0]._meta.links.content.url
            this.reportDates.productionProgram = json.data[0].modificationTime
            this.http.get(nextLink, { responseType: 'text', headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe(data => {
              const rows = this.htmlToJson(data, '[lid=Liste1] tr')
              rows.forEach((row, index, rows) => {
                this.config.config.reports.trucks.columns.productionProgram.shouldBeNumber.forEach(num => {
                  rows[index][num] = isNaN(rows[index][num]) || !rows[index][num] ? 0 : parseFloat(rows[index][num])
                })
              })
              observer.next({ success: true, data: rows })
              observer.complete()
            }, err => {
              observer.next({ success: false, data: [], error: 'PP - Fail at getting report table data.', more: err })
              observer.complete()
            })
          }, err => {
            observer.next({ success: false, data: [], error: 'PP - Fail at getting last report versions.', more: err })
            observer.complete()
          })
        }, err => {
          observer.next({ success: false, data: [], error: 'PP - Fail at retrieving report info.', more: err })
          observer.complete()
        })
      })
    } else {
      return new Observable(observer => {
        this.http.get('assets/reports/production_program.fake.json').subscribe((res: any[]) => {
          observer.next({ success: true, data: res })
          observer.complete()
        })
      })
    }
  }

  // Get Allocation Data from Report (tmp JSON file)
  getAllocationData(ReportID: string): Observable<{ success: boolean, data?: any[], error?: string, more?: any }> {
    if (this.corpintra) {
      return new Observable(observer => {
        this.http.get('/internal/bi/v1/objects/' + ReportID + '/versions', { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
          const nextLink = json.data[0]._meta.links.outputs.url
          this.http.get(nextLink, { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
            const nextLink = json.data[0]._meta.links.content.url
            this.reportDates.allocation = json.data[0].modificationTime
            this.http.get(nextLink, { responseType: 'text', headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe(data => {
              const rows = this.htmlToJson(data, '[lid=Final] tr')
              rows.forEach((row, index, rows) => {
                rows[index][17] = rows[index][17].toString().replace('-', '')
                this.config.config.reports.trucks.columns.allocation.shouldBeNumber.forEach(num => {
                  rows[index][num] = isNaN(rows[index][num]) ? 0 : parseFloat(rows[index][num])
                })
              })
              observer.next({ success: true, data: rows })
              observer.complete()
            }, err => {
              observer.next({ success: false, data: [], error: 'ALOC - Fail at getting report table data.', more: err })
              observer.complete()
            })
          }, err => {
            observer.next({ success: false, data: [], error: 'ALOC - Fail at getting last report versions.', more: err })
            observer.complete()
          })
        }, err => {
          observer.next({ success: false, data: [], error: 'ALOC - Fail at retrieving report info.', more: err })
          observer.complete()
        })
      })
    } else {
      return new Observable(observer => {
        this.http.get('assets/reports/allocation.json').subscribe((res: any[]) => {
          observer.next({ success: true, data: res })
          observer.complete()
        })
      })
    }
  }

  // Get Plant Stock Data from Report (tmp JSON file)
  getPlantStockData(ReportID: string): Observable<{ success: boolean, data?: any[], error?: string, more?: any }> {
    if (this.corpintra) {
      return new Observable(observer => {
        this.http.get('/internal/bi/v1/objects/' + ReportID + '/versions', { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
          const nextLink = json.data[0]._meta.links.outputs.url
          this.http.get(nextLink, { headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe((json: any) => {
            const nextLink = json.data[0]._meta.links.content.url
            this.reportDates.plantStock = json.data[0].modificationTime
            this.http.get(nextLink, { responseType: 'text', headers: { 'X-XSRF-TOKEN': this.tools.xsrf_token } }).subscribe(data => {
              const rows = this.htmlToJson(data, '[lid=AMVARA_DATA_PS] tr')
              rows.forEach((row, index, rows) => {
                this.config.config.reports.trucks.columns.plantStock.shouldBeNumber.forEach(num => {
                  rows[index][num] = isNaN(rows[index][num]) ? 0 : parseFloat(rows[index][num])
                })
              })
              observer.next({ success: true, data: rows })
              observer.complete()
            }, err => {
              observer.next({ success: false, data: [], error: 'PS - Fail at getting report table data.', more: err })
              observer.complete()
            })
          }, err => {
            observer.next({ success: false, data: [], error: 'PS - Fail at getting last report versions.', more: err })
            observer.complete()
          })
        }, err => {
          observer.next({ success: false, data: [], error: 'PS - Fail at retrieving report info.', more: err })
          observer.complete()
        })
      })
    } else {
      return new Observable(observer => {
        this.http.get('assets/reports/plant_stock.fake.json').subscribe((res: any[]) => {
          observer.next({ success: true, data: res })
          observer.complete()
        })
      })
    }
  }
}
