import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeroComponent } from './features/home/components/hero/hero.component';
import { SidebarComponent } from './features/home/components/sidebar/sidebar.component';
import { JourneyGridComponent } from './features/home/components/journey-grid/journey-grid.component';
import { ContinuePlanningComponent } from './features/home/components/continue-planning/continue-planning.component';
import { PlanningSessionComponent } from './features/home/components/planning-session/planning-session.component';
import { StoriesComponent } from './features/home/components/stories/stories.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeroComponent, SidebarComponent, JourneyGridComponent, 
    ContinuePlanningComponent, PlanningSessionComponent, StoriesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'web';
}
