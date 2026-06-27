import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinuePlanningComponent } from './continue-planning.component';

describe('ContinuePlanningComponent', () => {
  let component: ContinuePlanningComponent;
  let fixture: ComponentFixture<ContinuePlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinuePlanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContinuePlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
