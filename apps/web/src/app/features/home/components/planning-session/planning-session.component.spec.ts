import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningSessionComponent } from './planning-session.component';

describe('PlanningSessionComponent', () => {
  let component: PlanningSessionComponent;
  let fixture: ComponentFixture<PlanningSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanningSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanningSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
