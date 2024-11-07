import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerSettingsComponent } from './timer-settings.component';

describe('TimerSettingsComponent', () => {
  let component: TimerSettingsComponent;
  let fixture: ComponentFixture<TimerSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TimerSettingsComponent]
    });
    fixture = TestBed.createComponent(TimerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
