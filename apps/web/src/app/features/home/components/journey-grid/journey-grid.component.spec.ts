import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JourneyGridComponent } from './journey-grid.component';

describe('JourneyGridComponent', () => {
  let component: JourneyGridComponent;
  let fixture: ComponentFixture<JourneyGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JourneyGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
