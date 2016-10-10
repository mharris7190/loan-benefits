import { NgReduxModule, NgRedux } from 'ng2-redux';
import * as createLogger from 'redux-logger';
import { rootReducer, IAppState } from '../store';

import { NgModule, ApplicationRef, enableProdMode } from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';

// Provider Actions
import {DataActions} from '../actions/data.actions';

const prod = process.env.ENV === 'production' || process.env.NODE_ENV === 'production';
if (prod) {
  enableProdMode();
}

@NgModule({
  imports: [
    BrowserModule,
    NgReduxModule,
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    DataActions
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
  constructor(
    public appRef: ApplicationRef,
    private ngRedux: NgRedux<IAppState>
  ) {
    const reduxMiddleware = prod ? [] : [createLogger()];
    this.ngRedux.configureStore(rootReducer, {}, reduxMiddleware);
  }
  hmrOnInit(hotStore: any): void {
    if (!hotStore || !hotStore.state) return;
    // inject AppStore here and update it
    const initialState = hotStore.state;
    this.ngRedux.replaceReducer(() => {
      return initialState;
    });

    if ('restoreInputValues' in hotStore) {
      hotStore.restoreInputValues();
    }
    // change detection
    this.appRef.tick();
    delete hotStore.state;
    delete hotStore.restoreInputValues;
  }

  hmrOnDestroy(hotStore: any): void {
    let cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // recreate elements
    hotStore.disposeOldHosts = createNewHosts(cmpLocation);

    // inject your AppStore and grab state then set it on store
    let appState = this.ngRedux.getState();
    hotStore.state = Object.assign({}, appState);


    // save input values
    hotStore.restoreInputValues  = createInputTransfer();
    // remove styles
    removeNgStyles();
  }

  hmrAfterDestroy(hotStore: any): void {
    // display new elements
    hotStore.disposeOldHosts();
    delete hotStore.disposeOldHosts;
    // anything you need done the component is removed
  }
}
