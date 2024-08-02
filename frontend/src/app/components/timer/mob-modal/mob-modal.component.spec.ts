import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobModalComponent } from './mob-modal.component';

describe('MobModalComponent', () => {
  let component: MobModalComponent;
  let fixture: ComponentFixture<MobModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MobModalComponent]
    });
    fixture = TestBed.createComponent(MobModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
