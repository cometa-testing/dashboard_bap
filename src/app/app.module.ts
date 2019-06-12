import { BrowserModule } from '@angular/platform-browser'
import { NgModule, APP_INITIALIZER, Injectable } from '@angular/core'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

// Global Components

import { AppComponent } from '@components/root/app.component'
import { HeaderComponent } from '@components/header/header.component'
import { LoaderComponent } from '@components/loader/loader.component'
import { FooterComponent } from '@components/footer/footer.component'

// App Modules - Aka pages

import { ProductionProgramModule } from '@modules/production-program/production-program.module'
import { AllocationModule } from '@modules/allocation/allocation.module'
import { OrderIntakeModule } from '@modules/order-intake/order-intake.module'
import { PlantStockModule } from '@modules/plant-stock/plant-stock.module'
import { AboutModule } from '@modules/about/about.module'
import { HelpModule } from '@modules/help/help.module'

// Routing Module
// We have to import a Custom Routing Module from another module designed for that.

import { RoutingModule } from './routing.module'

// Services - aka providers
// Used to communicate components

import { LoadingService } from '@services/loading.service'
import { DataService } from '@services/data.service'
import { ApiService } from '@services/api.service'
import { ConfigService } from '@services/config.service';
import { ConnectionService } from 'ng-connection-service';

// Plugins
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

// Angular Material
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { environment } from '../environments/environment';
import { ToolsService } from '@services/tools.service';
import { SelectYearComponent } from './dialogs/select-year/select-year.component';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NewUpdateComponent } from './dialogs/new-update/new-update.component';
import { MatDialogModule } from '@angular/material/dialog';
import { NavigationGuard } from './guards/navigation-guard.guard';
import { AccessCodeComponent } from './components/access-code/access-code.component';
import { AccessGranted } from './guards/access-granted.guard';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CognosService } from '@services/cognos.service';
import { CookiesExpiredComponent } from './dialogs/cookies-expired/cookies-expired.component';

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { AuthInterceptor } from '@services/http-interceptor';
import { APP_BASE_HREF } from '@angular/common';
import {  OnlyNumbers } from './directives/only-numbers.directive';

declare var Hammer: any;

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any> {
    'swipe': { direction: Hammer.DIRECTION_HORIZONTAL }
  }
  buildHammer(element: HTMLElement) {
    let mc = new Hammer(element, {
      touchAction: "pan-y",
    })
    return mc
  }
}

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoaderComponent,
    FooterComponent,
    NewUpdateComponent,
    AccessCodeComponent,
    CookiesExpiredComponent,
    OnlyNumbers
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RoutingModule,
    // Pages Modules
    ProductionProgramModule,
    AllocationModule,
    OrderIntakeModule,
    PlantStockModule,
    AboutModule,
    HelpModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    // Angular Material Modules
    MatTooltipModule,
    MatSidenavModule,
    MatDialogModule,
    // Plugins
    RoundProgressModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader),
          deps: [HttpClient],
      }
    }),
    //ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.development })
  ],
  entryComponents: [
    SelectYearComponent,
    NewUpdateComponent,
    CookiesExpiredComponent
  ],
  providers: [
    LoadingService,
    DataService,
    ApiService,
    ConnectionService,
    ConfigService,
    ToolsService,
    NavigationGuard,
    CognosService,
    AccessGranted,
    AuthInterceptor,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    },
    {
      // Check if a user is logged and manages the login system
      provide: APP_INITIALIZER,
      useFactory: (cognosService: CognosService) => () => cognosService.load(),
      deps: [CognosService],
      multi: true
    },
    {
      // This loads the config.json file before the App is initialized
      provide: APP_INITIALIZER,
      useFactory: (configService: ConfigService) => () => configService.load(),
      deps: [ConfigService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      deps: [ConfigService, ApiService],
      multi: true
    },
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
