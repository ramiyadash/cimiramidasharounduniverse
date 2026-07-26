import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {
  CompanionChoice,
  JourneyTheme
} from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-planning-session',
  imports: [],
  templateUrl: './planning-session.component.html',
  styleUrl: './planning-session.component.scss'
})
export class PlanningSessionComponent implements OnChanges {
  @Input()
  journey!: JourneyTheme;

  selectedChoice: CompanionChoice | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['journey'] &&
      !changes['journey'].firstChange
    ) {
      this.resetConversation();
    }
  } 

  resetConversation(): void {
    this.selectedChoice = null;
  }

  get companionResponse(): string {
    if (!this.selectedChoice) {
      return '';
    }

    switch (this.selectedChoice.title) {
      case 'Mountains':
        return 'Great choice. Are you imagining a quiet cabin, scenic trails, or a lively mountain town?';

      case 'Water':
        return 'That sounds refreshing. Would you prefer a beach, a peaceful lake, or a charming coastal town?';

      case 'City':
        return 'Perfect. Are you looking for food, nightlife, museums, or a little bit of everything?';

      case 'Beach':
        return 'A family beach trip sounds wonderful. Should it feel relaxing, activity-filled, or balanced?';

      case 'Nature':
        return 'I like that direction. We can look for easy trails, wildlife, scenic drives, and plenty of space to unwind.';

      case 'Theme Parks':
        return 'Exciting choice. Let’s balance the big attractions with enough downtime for everyone.';

      case 'Hiking':
        return 'Excellent. Are you looking for relaxed scenic trails or something that feels like a real challenge?';

      case 'Camping':
        return 'Camping can make a trip unforgettable. Would you prefer comfort, wilderness, or something in between?';

      case 'Road Trip':
        return 'Love it. A great road trip needs memorable stops, beautiful views, and just enough spontaneity.';

      case 'Street Food':
        return 'Now we are talking. Let’s find a place where the best meals are discovered one neighborhood at a time.';

      case 'Coffee':
        return 'Perfect. I’m already imagining local cafés, walkable streets, and slow mornings.';

      case 'History':
        return 'That is a wonderful combination. We can explore a destination through its food, architecture, and local stories.';

      case 'Surprise Me':
        return 'I like your trust. Give me a moment and I’ll think beyond the obvious choices.';

      default:
        return 'That sounds like a great direction. Let’s explore it together.';
    }
  }

  selectChoice(choice: CompanionChoice): void {
    this.selectedChoice = choice;
  }
}