import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '@services/loading.service';
import { DataService } from '@services/data.service';
import { ApiService } from '@services/api.service';
import { ConfigService } from '@services/config.service';
import { Title } from '@angular/platform-browser';
import * as moment from 'moment';

@Component({
  selector: 'production-program-lvl2',
  templateUrl: './production-program-lvl2.component.html',
  styleUrls: ['./production-program-lvl2.component.scss'],
  host: {
    '(swiperight)': 'return()'
  }
})
export class ProductionProgramLvl2Component implements OnInit {

  ZoneID: any = null
  PlantID: any = null

  plandate: string = ''

  ready: boolean = false

  constructor(
    private activatedRoute: ActivatedRoute,
    private loader: LoadingService,
    public data: DataService,
    private api: ApiService,
    private config: ConfigService,
    private router: Router,
    private title: Title
  ) {
    title.setTitle(this.config.config.appTitle + ' - Production Program')
    // Show the loader while getting/loading the data
    this.loader.loading$.next(true)
    this.activatedRoute.paramMap.subscribe(params => {
      this.year = params.get('year')
      this.type = params.get('type')
      this.id = params.get('id')
      if (params.get('type') == 'zone') {
        this.ZoneID = params.get('id')
      } else {
        this.PlantID = params.get('id')
      }
      // If no Order Intake rows were found, get them
      if (this.data.productionProgramData.length == 0) {
        this.api.getProductionProgramData(this.config.config.reports[this.config.config.target][this.config.config.scenario].productionProgram).subscribe(res => {
          this.plandate = moment(res.data[0][14], 'DD.MM.YYYY').format(this.config.config.language == 'en' ? 'DD/MM/YYYY' : 'DD.MM.YYYY')
          this.data.productionProgramData = res.data
          this.productionProgramData = res.data.filter(dat => dat[13] == this.year)
          if (this.ZoneID != null) {
            const tmp = this.data.productionProgramData.filter(item => item[0] == this.ZoneID)
            this.years = Object.keys(this.data.classifyByIndex(tmp, 13))
          } else {
            const tmp = this.data.productionProgramData.filter(item => item[3] == this.PlantID)
            this.years = Object.keys(this.data.classifyByIndex(tmp, 13))
          }
          try {
            this.rollupData()
          } catch (err) {
            this.router.navigate(['production-program'], { replaceUrl: true })
          }
          this.loader.loading$.next(false)
        })
      } else {
        this.plandate = moment(this.data.productionProgramData[0][14], 'DD.MM.YYYY').format(this.config.config.language == 'en' ? 'DD/MM/YYYY' : 'DD.MM.YYYY')
        this.productionProgramData = this.data.productionProgramData.filter(dat => dat[13] == this.year)
        this.years = Object.keys(this.data.classifyByIndex(this.data.productionProgramData, 13))
        // Transform numeric values to real numeric values, also checking NaN or null
        this.productionProgramData.forEach((row, index, rows) => {
          rows[index][15] = isNaN(rows[index][15]) ? 0 : parseFloat(rows[index][15])
          rows[index][16] = isNaN(rows[index][16]) ? 0 : parseFloat(rows[index][16])
          rows[index][17] = isNaN(rows[index][17]) ? 0 : parseFloat(rows[index][17])
          rows[index][18] = isNaN(rows[index][18]) ? 0 : parseFloat(rows[index][18])
          rows[index][19] = isNaN(rows[index][19]) ? 0 : parseFloat(rows[index][19])
          rows[index][20] = isNaN(rows[index][20]) ? 0 : parseFloat(rows[index][20])
          rows[index][21] = isNaN(rows[index][21]) ? 0 : parseFloat(rows[index][21])
          rows[index][22] = isNaN(rows[index][22]) ? 0 : parseFloat(rows[index][22])
          rows[index][23] = isNaN(rows[index][23]) ? 0 : parseFloat(rows[index][23])
          rows[index][24] = isNaN(rows[index][24]) ? 0 : parseFloat(rows[index][24])
        })
        try {
          this.rollupData()
        } catch (err) {
          this.router.navigate(['production-program'], { replaceUrl: true })
        }
        this.loader.loading$.next(false)
      }
    })
  }

  productionProgramData: any[][] = []

  year: string = ''
  type: string = ''
  id: string = ''
  years: string[] = []

  groupInfo: any

  changeYear(year: string, years?: string[]) : void  {
    localStorage.setItem('production-year', year)
    this.loader.loading$.next(true)
    this.router.navigate(['production-program', year, this.type, this.id], { replaceUrl: true })
  }

  rollupData(): void {
    let rows
    // Reduce rows depending on route, by Plant or by Zone
    if (this.ZoneID != null) {
      rows = this.data.classifyByIndex(this.productionProgramData, 0)[this.ZoneID]
    } else {
      rows = this.data.classifyByIndex(this.productionProgramData, 3)[this.PlantID]
    }
    // Gettings rows only for the zone selected
    let zoneRows = this.productionProgramData.reduce((r, a) => {
        r[a[0]] = r[a[0]] || []
        r[a[0]].push(a)
        return r
    }, {})[rows[0][0]]
    // Getting rows only for the plant selected
    let plantRows = this.productionProgramData.reduce((r, a) => {
      r[a[3]] = r[a[3]] || []
      r[a[3]].push(a)
      return r
    }, {})[rows[0][3]]
    // Collect data info for data headers
    this.groupInfo = {
      zone: this.ZoneID != null,
      zoneRows: zoneRows,
      plantRows: plantRows,
      rowsPlain: rows,
      zoneID: rows[0][0],
      plantID: rows[0][3],
      totalCustomer: this.data.sumByIndex(this.productionProgramData, 15),
      totalPlan: this.data.sumByIndex(this.productionProgramData, 16),
      totalTotal: this.data.sumByIndex(this.productionProgramData, 17),
      totalTotalDiff: this.data.sumByIndex(this.productionProgramData, 21),
      totalReserve: this.data.sumByIndex(this.productionProgramData, 22),
      zoneTitle: rows[0][this.config.config.language == 'en' ? 2 : 1],
      plantTitle: rows[0][this.config.config.language == 'en' ? 7 : 6],
      zoneCustomer: this.data.sumByIndex(zoneRows, 15),
      zonePlan: this.data.sumByIndex(zoneRows, 16),
      zoneTotal: this.data.sumByIndex(zoneRows, 17),
      zoneTotalDiff: this.data.sumByIndex(zoneRows, 21),
      zoneReserve: this.data.sumByIndex(zoneRows, 22),
      plantCustomer: this.data.sumByIndex(plantRows, 15),
      plantPlan: this.data.sumByIndex(plantRows, 16),
      plantTotal: this.data.sumByIndex(plantRows, 17),
      plantTotalDiff: this.data.sumByIndex(plantRows, 21),
      plantReserve: this.data.sumByIndex(plantRows, 22),
      regions: this.data.classifyByIndex(rows, this.config.config.language == 'en' ? 10 : 9),
      products: this.data.classifyByIndex(rows, this.config.config.language == 'en' ? 12 : 11)
    }
    this.title.setTitle(this.config.config.appTitle + ' - Production Program - '+(this.ZoneID != null ? this.groupInfo.zoneTitle : this.groupInfo.plantTitle))
    this.groupInfo.regionKeys = Object.keys(this.groupInfo.regions).sort()
    this.groupInfo.productKeys = Object.keys(this.groupInfo.products).sort()
    this.groupInfo.progress1Value =  this.ZoneID != null ? this.groupInfo.zoneCustomer : this.groupInfo.plantCustomer
    this.groupInfo.progress2Value =  this.ZoneID != null ? this.groupInfo.zonePlan : this.groupInfo.plantPlan
    this.groupInfo.progress3Value =  this.ZoneID != null ? this.groupInfo.zoneTotal : this.groupInfo.plantTotal
    this.groupInfo.progress4Value =  this.ZoneID != null ? this.groupInfo.zoneReserve : this.groupInfo.plantReserve
    this.groupInfo.progress1 = this.ZoneID != null ?
      this.percent(this.groupInfo.zoneCustomer, this.groupInfo.totalCustomer) : 
      this.percent(this.groupInfo.plantCustomer, this.groupInfo.zoneCustomer)
    this.groupInfo.progress2 = this.ZoneID != null ?
      this.percent(this.groupInfo.zonePlan, this.groupInfo.totalPlan) :
      this.percent(this.groupInfo.plantPlan, this.groupInfo.zonePlan)
    this.groupInfo.progress3 = this.ZoneID != null ?
      this.percent(this.groupInfo.zoneTotal, this.groupInfo.totalTotal) :
      this.percent(this.groupInfo.plantTotal, this.groupInfo.zoneTotal)
    this.groupInfo.progress4 = this.ZoneID != null ?
      this.percent(this.groupInfo.zoneReserve, this.groupInfo.totalReserve) :
      this.percent(this.groupInfo.plantReserve, this.groupInfo.zoneReserve)
    this.groupInfo = Object.assign({}, this.groupInfo)
    // Tell the DOM it's ready to rock ’n’ roll !
    setTimeout(() => this.ready = true)
  }

  percent(part: number, total: number) : number {
    return parseInt(((part * 100) / total).toFixed(0))
  }

  ngOnInit() {
  }

  return() : void {
    this.router.navigate(['../../'], { relativeTo: this.activatedRoute, replaceUrl: true })
  }

  forward(): void {
    if (this.data.lastTap2) {
      if (this.data.lastTap2.type == 'region') {
        this.router.navigate(['region', this.data.lastTap2.key], { relativeTo: this.activatedRoute, replaceUrl: true })
      } else {
        this.router.navigate(['product', this.data.lastTap2.key], { relativeTo: this.activatedRoute, replaceUrl: true })
      }
    }
  }

  goProduct(ProductID): void {
    this.data.lastTap = {
      type: 'region',
      key: encodeURI(ProductID)
    }
    this.router.navigate(['region', ProductID], { relativeTo: this.activatedRoute, replaceUrl: true })
  }
  
  goRegion(RegionID): void {
    this.data.lastTap = {
      type: 'product',
      key: encodeURI(RegionID)
    }
    this.router.navigate(['product', RegionID], { relativeTo: this.activatedRoute, replaceUrl: true })
  }

}
